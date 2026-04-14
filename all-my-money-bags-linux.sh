#!/bin/bash

WHICH_BROWSER=$1;

if [ -z "$WHICH_BROWSER" ]; then
    echo -e "\n Need to know which browser to use.\n"
    exit 1;
fi;

BROWSER_PROFILE_DIR="${HOME}/.all-my-money-bags-browser-data";
if [ ! -d "$BROWSER_PROFILE_DIR" ]; then
    mkdir $BROWSER_PROFILE_DIR;
fi;

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_SCRIPT="$SCRIPT_DIR/rpc-proxy-server.mjs"
HTML_FILE="$SCRIPT_DIR/SimpleWebPageCryptoWallet-loggedoff.html"

BROWSER_PID=;
PROXY_PID=;

timestamp() {
  date +"[%Y-%m-%d %H:%M:%S]"
}

print_banner() {
  local icon="$1"
  local text="$2"
  local color="$3"
  local padded_text="  $text  "
  local len=${#padded_text}
  local border_top="╔$(printf '═%.0s' $(seq 1 $len))╗"
  local border_bottom="╚$(printf '═%.0s' $(seq 1 $len))╝"
  echo -e "\n$(timestamp) $icon ${color}${border_top}\033[0m"
  echo -e "$(timestamp) $icon ${color}║${padded_text}║\033[0m"
  echo -e "$(timestamp) $icon ${color}${border_bottom}\033[0m\n"
}

wait_on_processes() {

  # Wait for either proxy or browser to exit
  isProxy=$(ps -p "$PROXY_PID" 2>/dev/null|grep -v -E "PID|TTY|TIME|CMD");
  if [ "$isProxy" != "" ]; then PROXY_STILL_RUNNING=1; else PROXY_STILL_RUNNING=0; fi;

  isBrowser=$(ps -p "$BROWSER_PID" 2>/dev/null|grep -v -E "PID|TTY|TIME|CMD");
  if [ "$isBrowser" != "" ]; then BROWSER_STILL_RUNNING=1; else BROWSER_STILL_RUNNING=0; fi;

  # If browser exited first, kill proxy
  if [ "$isBrowser" = "" ] && [ "$isProxy" != "" ];
  then
    print_banner "🛑" "Browser has ended, killing Proxy." "\033[1;35m"
    kill -s SIGUSR2  "$PROXY_PID";
    rm -f /tmp/PROXY_PID${PROXY_PID};
    return 2;
  fi;

  # If proxy exited first, kill browser
  if [ "$isProxy" = "" ] && [ "$isBrowser" != "" ];
  then
    print_banner "🛑" "Proxy has ended, killing Browser." "\033[1;35m"
    kill -s SIGUSR2 "$BROWSER_PID";
    rm -f /tmp/BROWSER_PID${BROWSER_PID};
    return 2;
  fi;

  if [ "$isBrowser" = "" ] && [ "$isProxy" = "" ];
  then
    print_banner "🛑" "Browser has ended." "\033[1;35m"
    rm -f /tmp/BROWSER_PID${BROWSER_PID};
    print_banner "🛑" "Proxy has ended." "\033[1;35m"
    rm -f /tmp/PROXY_PID${PROXY_PID};
    return 0;
  fi;

  sleep 0.1;
  return 1;
}


cleanup_after_processes() {
    echo;echo;
    echo "CLEANUP AFTER PROCESSES";

    cleanup_after_processes_wait_return_val=999;
    while [ $cleanup_after_processes_wait_return_val -gt 0 ];
    do
        wait_on_processes;
        cleanup_after_processes_wait_return_val=$?;
    done;
}

BROWSER_STILL_RUNNING=0;
PROXY_STILL_RUNNING=0;
graceful_shutdown() {
  wait_on_processes;
  if [ "$BROWSER_STILL_RUNNING" != "1" ] || [ "$PROXY_STILL_RUNNING" != "1" ];
  then
    print_banner "💥" "Proxy or Browser exited , stopping." "\033[1;31m";
    echo;echo;echo "GRACEFUL_SHUTDOWN....";
    cleanup_after_processes;
    trap - SIGINT SIGTERM
    echo;echo;echo "GRACEFUL_SHUTDOWN DONE";
    exit 1;
  else
    print_banner "🛑" "To exit, close the wallet app: All My Money Bags" "\033[1;35m"
  fi;
}

is_proxy_started() {
  for port in {18545..18549}; do
    pid=$(lsof -iTCP:"$port" -sTCP:LISTEN -Pn -t 2>/dev/null)
    if [[ -n "$pid" ]] && ps -p "$pid" -o cmd= | grep -q "rpc-proxy-server\.mjs"; then
      return 1; # SUCCESS
    fi
  done
  return 0; # FAILURE
}

HAD_TO_KILL_PROXY=0;
is_there_an_existing_proxy() {
  while true; do
    local cleared_all=true

    for pidfile in /tmp/PROXY_PID*; do
      [[ -f "$pidfile" ]] || continue
      pid=$(cat "$pidfile" 2>/dev/null)
      if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
        if ps -p "$pid" -o cmd= | grep -q "rpc-proxy-server\.mjs"; then
          echo -e "\nFound proxy process (from PID file):"
          ps -fp "$pid"
          read -p $'\nKill this process? [y/N]: ' killit
          if [[ "$killit" =~ ^[Yy]$ ]]; then
            kill -USR2 "$pid"
            rm -f "$pidfile"
            HAD_TO_KILL_PROXY=1;
            cleared_all=false
          else
            print_banner "🛑" "User aborted due to running proxy (PID $pid)." "\033[1;35m"
            cleanup_after_processes;
            exit 1
          fi
        else
          rm -f "$pidfile"
        fi
      else
        rm -f "$pidfile"
      fi
    done

    # Check for rogue processes (not in PID files)
    for rogue_pid in $(pgrep -f "[n]ode.*rpc-proxy-server\.mjs"); do
      echo -e "\nFound rogue proxy process (no PID file):"
      ps -fp "$rogue_pid"
      read -p $'\nKill this process? [y/N]: ' killrogue
      if [[ "$killrogue" =~ ^[Yy]$ ]]; then
        kill -USR2 "$rogue_pid"
        cleared_all=false
        HAD_TO_KILL_PROXY=1;
      else
        print_banner "🛑" "User aborted due to running proxy (PID $rogue_pid)." "\033[1;35m"
        cleanup_after_processes;
        exit 1
      fi
    done

    [[ "$cleared_all" == true ]] && break
  done
}


HAD_TO_KILL_BROWSER=0;
EXISTING_BROWSER=0;
is_there_an_existing_browser() {
  echo -e "\n\nAre there existing wallet browsers running?....\n\n";
  local html_filename=$(basename "$HTML_FILE")
  while true; do
    local cleared_all=true

    # Check PID files first
    for pidfile in /tmp/BROWSER_PID*; do
      [[ -f "$pidfile" ]] || continue
      pid=$(cat "$pidfile" 2>/dev/null)
      if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
        cmdline=$(ps -p "$pid" -o args=)
        if [[ "$cmdline" == *"$WHICH_BROWSER"* && "$cmdline" == *"$html_filename"* ]]; then
          echo -e "\n\nFound browser process (from PID file):"
          ps -fp "$pid" | sed -e 's/--new-window/\n/' -e 's/file:\/\//\nfile:\/\//'
          echo -e "\n\n";
          EXISTING_BROWSER=1;
          read -p $'\nKill this process? [y/N]: ' killit
          if [[ "$killit" =~ ^[Yy]$ ]]; then
            kill "$pid"
            rm -f "$pidfile"
            cleared_all=false
            HAD_TO_KILL_BROWSER=1;
            EXISTING_BROWSER=0;
          else
            print_banner "🛑" "User aborted due to running browser (PID $pid)." "\033[1;35m"
            cleanup_after_processes;
            exit 1
          fi
        else
          echo -e "\n\n removing old browser pidfile: $pidfile\n\n";
          rm -f "$pidfile"
        fi
      else
        echo -e "\n\n removing old browser pidfile: $pidfile\n\n";
        rm -f "$pidfile"
      fi
    done


    # Check rogue browsers with no PID files
    while true; do
      rogue_browser=$(ps -ef |grep -E "brave.*new-window.*money.*html" | grep -v grep);
      if [ "$rogue_browser" != "" ];
      then
        echo -e "\n==========================================================";
        echo $rogue_browser | sed -e 's/--new-window/--new-window\n/' -e 's/file:\/\//file:\/\/\n/';
        rogue_pid=$(echo $rogue_browser | awk '{print $2}');
        echo -e "\nFound rogue browser process (no PID file): $rogue_pid";
        echo -e "==========================================================\n";
        EXISTING_BROWSER=1;
        read -p $'\nKill this process? [y/N]: ' killrogue
        if [[ "$killrogue" =~ ^[Yy]$ ]]; then
          kill "$rogue_pid"
          cleared_all=false
          HAD_TO_KILL_BROWSER=1;
          EXISTING_BROWSER=0;
        else
          print_banner "🛑" "User aborted due to running browser (PID $rogue_pid)." "\033[1;35m"
          cleanup_after_processes;
          exit 1
        fi
      else
          break;
      fi
    done;

    [[ "$cleared_all" == true ]] && break
  done
echo -e "\n\nCompleted check for pre-existing wallet browsers\n\n";
}


start_browser() {
  print_banner "🌐" "Launching browser: $WHICH_BROWSER" "\033[1;34m"
  setsid "$WHICH_BROWSER" \
    --new-window \
    --user-data-dir="$BROWSER_PROFILE_DIR" \
    "file://$HTML_FILE" &
  sleep 2;
  BROWSER_PID=$(ps -ef 2>/dev/null|grep -E ".*new-window.*money.*html" 2>/dev/null| grep -v -E "grep|bin\/bash" 2>/dev/null | awk '{print $2}');
  echo "$BROWSER_PID" > /tmp/BROWSER_PID${BROWSER_PID}
}

check_proxy_lockfile_pid() {
  local lockfile="/tmp/all-my-money-bags-proxy.lock"
  if [[ -f "$lockfile" ]]; then
    local pid=$(cat "$lockfile" 2>/dev/null | awk '{print $1}')
    if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
      echo -e "\nFound proxy lockfile with active PID ($pid):"
      ps -fp "$pid"
      read -p $'\nKill this process? [y/N]: ' killlock
      if [[ "$killlock" =~ ^[Yy]$ ]]; then
        kill -USR2 "$pid"
        rm -f "$lockfile"
        HAD_TO_KILL_PROXY=1
      else
        print_banner "🛑" "User aborted due to locked proxy (PID $pid)." "\033[1;35m"
        cleanup_after_processes;
        exit 1
      fi
    else
      echo -e "\nRemoving stale lockfile: $lockfile"
      rm -f "$lockfile"
    fi
  fi
}


#this sets up the signal-handling
trap graceful_shutdown SIGINT SIGTERM;

check_proxy_lockfile_pid;
is_there_an_existing_proxy;
is_there_an_existing_browser;

if [ "$HAD_TO_KLL_PROXY" = "1" ] || [ "$HAD_TO_KILL_BROWSER" = "1" ] || [ "$EXISTING_BROWSER" = "1" ];
then
  if [ "$EXISTING_BROWSER" = "1" ];
  then
    print_banner "🛑" "There is another RUNNING browser window." "\033[1;35m"
  fi;
  print_banner "🛑" "You will have to start App again." "\033[1;35m"
  cleanup_after_processes;
  exit;
fi;

print_banner "📡" "Starting RPC Proxy Server..." "\033[1;36m"
setsid node "$PROXY_SCRIPT" &
PROXY_PID=$!
echo "$PROXY_PID" > /tmp/PROXY_PID${PROXY_PID}

if ! is_proxy_started; then
  print_banner "🛑" "Failed To Start Proxy" "\033[1;35m"
  cleanup_after_processes;
  exit 1;
fi;

start_browser;
wait_on_processes;

while true; do
  wait_on_processes;

  if [ "$BROWSER_STILL_RUNNING" != "1" ] && [ "$PROXY_STILL_RUNNING" != "1" ];
  then
    print_banner "💥" "Proxy & Browser exited , stopping." "\033[1;31m"
    cleanup_after_processes;
    exit 1;
  fi;
done

cleanup_after_processes;
exit 0;


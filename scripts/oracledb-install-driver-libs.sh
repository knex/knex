#!/usr/bin/env bash

# Exit on error
set -e

# Directory constants
repo_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
exec_dir="$( pwd )"
script_dir="$repo_dir/scripts/"
docker_compose_file="$repo_dir/scripts/docker-compose.yml"

help_text="
Helper script to install oracle drivers on local linux machine from Oracle
database container.

    oracledb-install-driver-libs.sh COMMAND

    COMMAND:
        run: Do the driver install.
        dry-run: Do the driver install but do not save any files.
        help: Print this menu.

    NOTES FOR USAGE:
    1. This script is tested to work on Ubuntu 18.04 LTS.
    2. This script requires you to have sudo capabilities so to use ldconfig.
"

# Main script logic
cmd="$1"

function main () {
    case "$1" in
        "run")
            printf "Starting run ...\n"
            do_install true
            exit 0
            ;;
        "dry-run")
            printf "Starting dry-run ...\n"
            do_install false
            exit 0
            ;;
        "help"|"--help"|"-h"|"")
            printf "$help_text"
            exit 0
            ;;
        *)
            printf "Unsupported command: $cmd\n"
            printf "Try running with 'help' to see supported commands.\n"
            exit 1
            ;;
    esac
}

function do_install () {
    do_changes="$1"
    printf "\nEnsuring oracle containers from docker-compose are up ...\n"
    docker-compose -f "$docker_compose_file" up --build -d oracledb
    docker-compose -f "$docker_compose_file" up waitoracledb
    printf "\nSleeping an extra 15 seconds to ensure oracle has fully started ...\n"
    sleep 15
    printf "\nInstalling oracle client libs to db container ...\n"
    set -x
    docker-compose -f "$docker_compose_file" exec -T oracledb curl http://yum.oracle.com/public-yum-ol7.repo -o /etc/yum.repos.d/public-yum-ol7.repo
    docker-compose -f "$docker_compose_file" exec -T oracledb yum install -y yum-utils
    docker-compose -f "$docker_compose_file" exec -T oracledb yum-config-manager --enable ol7_oracle_instantclient
    docker-compose -f "$docker_compose_file" exec -T oracledb yum install -y oracle-instantclient18.3-basiclite
    set +x
    printf "\nCopying to host's ~/lib directory and adding to ldconfig ...\n"
    if [ "$do_changes" = "true" ]; then
        set -x
        docker cp oracledb_container:/usr/lib/oracle/18.3/client64/lib/ ~/
        sudo sh -c "echo $HOME/lib > /etc/ld.so.conf.d/oracle-instantclient.conf"
        sudo ldconfig
        set +x
    else
        printf "(skipping because dry-run)\n"
    fi
}

# Start the bash app's main function
main "$cmd"

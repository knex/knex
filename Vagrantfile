require 'json'

DB_CONFIG    = JSON.load(File.read('test/integration/config.json'))
PACKAGES     = %w{build-essential mysql-server postgresql libpq-dev sqlite3}
NODE_VERSION = '0.10.24'
NODE_URL     = "http://nodejs.org/dist/v#{NODE_VERSION}/node-v#{NODE_VERSION}-linux-x64.tar.gz"

Vagrant.configure('2') do |config|
  config.vm.box = 'precise64'
  config.vm.box_url = 'http://files.vagrantup.com/precise64.box'

  config.vm.provision 'shell', inline: <<-EOF
    # Prevent package installation from asking questions; use defaults.
    export DEBIAN_FRONTEND=noninteractive

    # Install distribution-provided packages.
    apt-get update
    apt-get install --quiet --assume-yes #{PACKAGES.join(' ')}

    # Create MySQL database if it doesn't already exist.
    mysql -u '#{DB_CONFIG['mysql']['user']}' \
      <<< 'CREATE DATABASE IF NOT EXISTS #{DB_CONFIG['mysql']['database']}'

    # Configure PostgreSQL to allow passwordless login for all users.
    echo 'local all all     trust' >  '/etc/postgresql/9.1/main/pg_hba.conf'
    echo 'host  all all all trust' >> '/etc/postgresql/9.1/main/pg_hba.conf'
    service postgresql restart

    # Create PostgreSQL database if it doesn't already exist.
    psql --username=postgres --list --quiet --tuples-only \
      | cut --delimiter='|' --fields=1 \
      | grep --quiet --word-regexp '#{DB_CONFIG['postgres']['database']}' \
      || createdb --username='#{DB_CONFIG['postgres']['user']}' '#{DB_CONFIG['postgres']['database']}'

    # Install Node JS and NPM to /usr/local.
    wget --quiet --output-document=- #{NODE_URL} \
      | tar --extract --gunzip --strip-components=1 --directory="/usr/local"

    # Install Node modules, and ensure native extensions are compiled for Linux.
    cd /vagrant
    npm install
    npm rebuild
  EOF
end

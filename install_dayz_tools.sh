rm -f depbo-tools-0.8.41-linux-64bit.tgz || true

wget https://github.com/arma-actions/mikero-tools/raw/latest/linux/depbo-tools-0.8.41-linux-64bit.tgz

echo "Extracting depbo-tools-0.8.41-linux-64bit.tgz"
mkdir -p mikero-tools
tar -zxf "depbo-tools-0.8.41-linux-64bit.tgz" --strip-components=1 -C mikero-tools

echo "Installing dependencies"
sudo apt-get install -y libvorbisenc2

echo "Updating environment variables"
export PATH=$PATH:$PWD/mikero-tools/bin
echo $PATH
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$PWD/mikero-tools/lib

if [ ! -d config ]; then
   cp -r config.sample config
   echo "Copied ./config.sample ./config"
fi

echo "Building core..."
yarn workspace @lightshow/core build
echo "Building gpio-client..."
yarn workspace @lightshow/gpio-client build
echo "Building serial-dimmer-client..."
yarn workspace @lightshow/serial-dimmer-client build
echo "Building server..."
yarn workspace @lightshow/server build

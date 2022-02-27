echo "Building core..."
yarn workspace @lightshow/core build
echo "Building sms..."
yarn workspace @lightshow/sms build
echo "Building preview..."
yarn workspace @lightshow/preview build
echo "Building gpio-client..."
yarn workspace @lightshow/gpio-client build
echo "Building serial-dimmer-client..."
yarn workspace @lightshow/serial-dimmer-client build
echo "Building server..."
yarn workspace @lightshow/server build

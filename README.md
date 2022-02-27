<p align=center>
    <img src="assets/logo.svg" alt="lightshow" width=50 height=50 />
</p>
 <h2 align="center">lightshow</h2>

<p align="center">Control lights and music for Raspberry Pi and more.</p>

![lightshow](assets/demo.gif)

## Getting Started

```bash
# Install dependencies
yarn
# Build all packages
yarn build:all
# Copy sample config folder to ./config
yarn config:copy
```

### First time run

```bash
yarn workspace @lightshow/server start
```

1. Open the sample preview space @ http://localhost:3000/preview/space/demo-space?events=io.

2. To play the sample track, open http://localhost:3000/play?track=Deck%20the%20Halls in another tab.

3. Watch the demo space do it's thing!

![preview](assets/preview-space.gif)

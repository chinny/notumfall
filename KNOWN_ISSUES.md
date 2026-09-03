# Known Issues and Non-Blocking Warnings

- **Headless SwiftShader ReadPixels performance notice**: In headless software emulation mode without dedicated GPU hardware, Chromium emits a non-blocking performance warning regarding software rasterizer pixel reads. This does not occur under native hardware WebGL2 acceleration.
- **Web Audio Context Autoplay Policy**: Browsers require a user gesture (clicking the start screen) before initializing the Web Audio API context. The game safely waits for the initial link click before starting the ambient wind pad.

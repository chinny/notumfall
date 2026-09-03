import * as THREE from 'three';

export class DesertEnvironment {
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    // 1. Sun Directional Light
    this.sunLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    this.sunLight.position.set(120, 180, 80);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);

    // 2. Ambient / Hemisphere Light for baked-feel desert bounce
    this.ambientLight = new THREE.HemisphereLight(0x8cbdd6, 0xcaa078, 0.85);
    scene.add(this.ambientLight);

    // 3. Fog for atmospheric dust perspective
    scene.fog = new THREE.FogExp2(0xdfcaa8, 0.0048);

    // 4. Procedural Sky Dome
    const skyGeo = new THREE.SphereGeometry(350, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x407799) },
        horizonColor: { value: new THREE.Color(0xdfcaa8) },
        sunColor: { value: new THREE.Color(0xfffae6) },
        sunPosition: { value: this.sunLight.position.clone().normalize() }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = clamp(dir.y * 1.5, 0.0, 1.0);
          vec3 sky = mix(horizonColor, topColor, pow(h, 0.6));

          // Sun disc & atmospheric glow
          float sunDot = max(0.0, dot(dir, sunPosition));
          float sunGlow = pow(sunDot, 12.0) * 0.45;
          float sunCore = pow(sunDot, 256.0) * 1.5;

          vec3 finalColor = sky + sunColor * (sunGlow + sunCore);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyMesh);
  }

  public update(playerPos: THREE.Vector3) {
    this.skyMesh.position.copy(playerPos);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.position.set(playerPos.x + 120, playerPos.y + 180, playerPos.z + 80);
  }
}

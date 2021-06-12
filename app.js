'use strict'

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0); // OrbitControls가 camera를 움직일 때마다 카메라의 시선이 (0, 0, 0) 지점을 향하도록 설정함.
  controls.update(); // OrbitControls 값에 변화를 주면 업데이트를 호출해줘야 함.

  // create scene
  const scene = new THREE.Scene();

  // create directional light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // create BoxGeometry
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // BoxGeometry를 전달받아서 퐁-머티리얼과 함께 큐브 메쉬를 만들어주는 함수
  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube)

    cube.position.x = x;

    return cube;
  }

  // 각각 색상, x좌표값이 다른 큐브들을 3개 만들어서 cubes 배열 안에 저장해놓음. 나중에 animate 메서드에서 사용할 것.
  const cubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  /**
   * skybox를 만드는 세번째 방법 - 등장방형도법(Equirectangular map) 사용하기.
   * 
   * 등장방형도법은 HDRI 같은 거라고 보면 됨.
   * 먼저 등장방형도법(HDRI) 이미지를 TextureLoader()로 로드한 뒤,
   * onLoad 콜백함수를 전달해 줌.
   * 
   * 그리고 나서 해당 콜백함수 안에서 WebGLCubeRenderTarget을 생성함.
   * 얘는 렌더 타겟(직접 렌더링할 수 있는 텍스처)의 한 종류인데, 6개의 perspective camera를 갖는 CubeCamera 객체에 의해 사용되는 렌더타겟이라고 보면 됨.
   * 6개의 perspective camera에 의해 렌더되는 렌더타겟이라면, 당연히 cubemap의 형태로 생성이 될 것임.
   * 이걸 생성할 때, 로드해온 HDRI 이미지의 height값을 전달해줌으로써 해당 cubemap의 높이값, 즉 큐브맵의 크기를 지정해 줌. (렌더 타겟 생성 시 width, height값을 넘겨주는 것처럼..)
   * 
   * 또 WebGLCubeRenderTarget.fromEquirectangularTexture(renderer, HDRITexture) 메서드를 호출하면서 등장방형도법 이미지를 전달하면
   * 그걸 이용해서 WebGLCubeRenderTarget의 큐브맵으로 변환해 줌.
   * 
   * 결국 WebGLCubeRenderTarget.texture를 호출하면 큐브맵으로 변환된 등장방형도법 텍스처가 리턴되고,
   * 이거를 씬의 background에 할당해주면 됨.
   * 
   * 참고로 등장방형도법은 복잡한 쉐이더를 사용하기 때문에 큐브맵보다 성능이 떨어짐.
   * HDRI to CubeMap 사이트를 이용하면 hdri 이미지를 큐브맵을 만들때 사용하는 6개의 이미지로 변환해줄 수 있음.
   * 이렇게 변환한 이미지를 가지고 큐브맵을 만드는 것이 성능상 더 이로움.
   */
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    './image/tears_of_steel_bridge_2k.jpg',
    () => {
      const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
      rt.fromEquirectangularTexture(renderer, texture);
      scene.background = rt.texture;
    }
  );

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate
  function animate(t) {
    t *= 0.001;

    // 렌더러가 리사이징되면 카메라의 비율(aspect)도 리사이징된 사이즈에 맞게 업데이트 되어야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // cubes안에 담긴 각각의 cube mesh들의 rotation값에 매 프레임마다 변화를 줘서 회전시킴
    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = t * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부에서 반복 호출 해줌
  }

  requestAnimationFrame(animate);
}

main();
let scene, camera, renderer, car, score = 0;
let trees = [], houses = [], roadSegments = [], grassSegments = [], obstacles = [], coins = [];
const segmentLength = 100, numSegments = 2;

let themeSettings = {
  day: { background: 0x87ceeb, fog: [10, 60], sunColor: 0xffff00, grass: 0x228b22, road: 0x333333 },
  night: { background: 0x000033, fog: [5, 30], sunColor: 0xffffff, grass: 0x003300, road: 0x111111 },
  desert: { background: 0xffe4b5, fog: [10, 60], sunColor: 0xffd700, grass: 0xc2b280, road: 0x996633 },
  snow: { background: 0xe0f7fa, fog: [10, 60], sunColor: 0xffffff, grass: 0xffffff, road: 0xcccccc },
};

let currentTheme = "day";
let isGameRunning = false;

document.getElementById("start-button").onclick = () => {
  currentTheme = document.getElementById("theme-selector").value;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("hud").style.display = "block";
  init();
  animate();
};

document.getElementById("reset-button").onclick = () => location.reload();

function init() {
  scene = new THREE.Scene();
  const theme = themeSettings[currentTheme];
  scene.background = new THREE.Color(theme.background);
  scene.fog = new THREE.Fog(theme.background, ...theme.fog);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("game-container").appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(light);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({ color: theme.sunColor }));
  sun.position.set(-20, 20, -40);
  scene.add(sun);

  car = createCar();
  scene.add(car);

  camera.position.set(0, 5, 10);
  camera.lookAt(car.position);

  createGround(theme);
  createScenery(theme);
  isGameRunning = true;
}

function createCar(color = 0xff0000) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 3), new THREE.MeshPhongMaterial({ color }));
  body.position.y = 0.5;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.5), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
  cabin.position.set(0, 0.9, -0.2);
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  [[-0.7, 0.2, 1.2], [0.7, 0.2, 1.2], [-0.7, 0.2, -1.2], [0.7, 0.2, -1.2]].forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    group.add(wheel);
  });

  group.position.set(0, 0.1, 0);
  return group;
}

function createGround(theme) {
  for (let i = 0; i < numSegments; i++) {
    const grassMat = new THREE.MeshBasicMaterial({ color: theme.grass });
    const roadMat = new THREE.MeshBasicMaterial({ color: theme.road });

    const lg = new THREE.Mesh(new THREE.PlaneGeometry(20, segmentLength), grassMat);
    lg.rotation.x = -Math.PI / 2;
    lg.position.set(-15, 0, -i * segmentLength);
    scene.add(lg); grassSegments.push(lg);

    const rg = new THREE.Mesh(new THREE.PlaneGeometry(20, segmentLength), grassMat);
    rg.rotation.x = -Math.PI / 2;
    rg.position.set(15, 0, -i * segmentLength);
    scene.add(rg); grassSegments.push(rg);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, segmentLength), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -i * segmentLength);
    scene.add(road); roadSegments.push(road);

    createObstacle(-i * segmentLength);
    createCoin(-i * segmentLength);
  }
}

function createScenery(theme) {
  for (let i = 0; i < 10; i++) {
    const z = -i * 20;
    trees.push(createTree(-6, z), createTree(6, z));
    if (i % 2 === 0) houses.push(createHouse(-10, z), createHouse(10, z));
  }
}

function createTree(x, z) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1),
    new THREE.MeshBasicMaterial({ color: 0x8b4513 }));
  trunk.position.set(x, 0.5, z);
  scene.add(trunk);

  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.5),
    new THREE.MeshBasicMaterial({ color: 0x006400 }));
  leaves.position.set(x, 1.3, z);
  scene.add(leaves);

  return { trunk, leaves };
}

function createHouse(x, z) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0x8b0000 }));
  base.position.set(x, 1, z);
  scene.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
  roof.position.set(x, 2, z);
  scene.add(roof);

  return { base, roof };
}

function createObstacle(z) {
  const obstacle = createCar(0x000000);
  obstacle.position.set(Math.random() < 0.5 ? -2 : 2, 0.1, z);
  obstacle.userData.speed = 0.05 + Math.random() * 0.05;
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function createCoin(z) {
  const coin = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 8, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd700 }));
  coin.rotation.x = Math.PI / 2; // Make coin vertical (rotate around x-axis)
  coin.position.set((Math.random() < 0.5 ? -2 : 2), 0.3, z);
  coin.userData.bounceHeight = Math.random() * 0.5 + 0.1; // Random bounce height
  coin.userData.bounceSpeed = Math.random() * 0.05 + 0.02; // Random bounce speed
  scene.add(coin);
  coins.push(coin);
}

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function animate() {
  if (!isGameRunning) return;
  requestAnimationFrame(animate);

  if (keys["ArrowLeft"] && car.position.x > -4) car.position.x -= 0.1;
  if (keys["ArrowRight"] && car.position.x < 4) car.position.x += 0.1;

  car.position.z -= 0.1;
  camera.position.z = car.position.z + 10;
  camera.lookAt(car.position);

  score += 1;
  document.getElementById("score").textContent = `Score: ${Math.floor(score / 10)}`;

  // Collision with obstacles
  for (let obs of obstacles) {
    obs.position.z += obs.userData.speed;
    if (car.position.distanceTo(obs.position) < 1.5) return endGame();
  }

  // Coin collection and bouncing
  for (let coin of coins) {
    if (car.position.distanceTo(coin.position) < 1) {
      coin.visible = false;
      score += 100; // Add score for collecting coin
    }

    // Bouncing logic for coins
    coin.position.y = Math.sin(coin.userData.bounceSpeed * Date.now()) * coin.userData.bounceHeight + 0.3;
  }

  // Recycling
  recycleSegments(roadSegments, segmentLength);
  recycleObstacles();
  recycleCoins();
  recycleTreeHouse(trees, 20);
  recycleTreeHouse(houses, 40);
  recycleGrass(grassSegments, segmentLength);

  renderer.render(scene, camera);
}

function recycleSegments(segments, length) {
  segments.forEach(s => {
    if (car.position.z - s.position.z < -length) s.position.z -= length * numSegments;
  });
}

function recycleObstacles() {
  obstacles.forEach(obs => {
    if (car.position.z - obs.position.z < -segmentLength) {
      obs.position.z -= segmentLength * numSegments;
      obs.position.x = Math.random() < 0.5 ? -2 : 2;
      obs.userData.speed = 0.05 + Math.random() * 0.05;
    }
  });
}

function recycleCoins() {
  coins.forEach(coin => {
    if (car.position.z - coin.position.z < -segmentLength) {
      coin.position.z -= segmentLength * numSegments;
      coin.position.x = Math.random() < 0.5 ? -2 : 2;
      coin.visible = true;
    }
  });
}

function recycleTreeHouse(array, spacing) {
  array.forEach(obj => {
    let item = obj.trunk || obj.base;
    if (car.position.z - item.position.z < -spacing) {
      let dz = spacing * array.length / 2;
      if (obj.trunk) {
        obj.trunk.position.z -= dz;
        obj.leaves.position.z -= dz;
      } else {
        obj.base.position.z -= dz;
        obj.roof.position.z -= dz;
      }
    }
  });
}

function recycleGrass(grass, length) {
  grass.forEach(segment => {
    if (car.position.z - segment.position.z < -length) {
      segment.position.z -= length * numSegments;
    }
  });
}

function endGame() {
  isGameRunning = false;
  alert("Game Over! Your Score: " + Math.floor(score / 10));
  document.getElementById("hud").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
}

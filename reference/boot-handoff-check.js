import { ArchiveScene } from '/src/scene.ts';
const result = document.querySelector('#result');
const checks = [];
const near = (actual, expected, name) => {
  if (Math.abs(actual - expected) > .001) throw Error(`${name}: ${actual} != ${expected}`);
  checks.push(name);
};
try {
  const scene = new ArchiveScene(document.querySelector('#scene'));
  await scene.load();
  scene.select(0);
  const coldCamera = scene.camera.position.x;
  await scene.prepareOpening();
  near(scene.camera.position.x, coldCamera, 'preparation preserves initial camera');
  scene.setMode('detail');
  near(scene.camera.position.x, coldCamera, 'direct detail does not apply cinematic offset');
  for (const mode of ['detail', 'archive', 'detail']) {
    scene.setMode('hidden');
    scene.select(0);
    scene.update(1, {time:34.99,reveal:1,lift:1,zoom:1});
    const before = scene.getStats();
    const cameraX = scene.camera.position.x;
    scene.setMode(mode);
    near(scene.camera.position.x - cameraX, -before.columnCamera, `${mode}: camera receives array origin shift`);
    const afterHandoff = scene.camera.position.x;
    scene.setMode(mode);
    near(scene.camera.position.x, afterHandoff, `${mode}: repeated mode does not shift twice`);
    scene.update(1.000001);
    const after = scene.getStats();
    near(after.cameraPosition[0] - after.modelPosition[0], before.cameraPosition[0] - before.modelPosition[0], `${mode}: camera/card X relation is continuous`);
  }
  for (const [width, height] of [[1920,1080], [1440,1080], [2560,1080], [390,844]]) {
    const container = document.querySelector('#scene');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    scene.resize();
    scene.setMode('hidden');
    scene.select(0);
    scene.update(10, {time:26.56,reveal:1,lift:.4,zoom:0,browseEntry:true});
    const entryEnd = scene.getStats();
    const cells = JSON.stringify(scene.cells);
    const camera = scene.camera.position.clone();
    scene.setMode('archive');
    near(scene.camera.position.distanceTo(camera), 0, `${width}x${height}: no origin jump`);
    for (let i = 1; i <= 120; i++) {
      scene.update(10 + i / 120);
      const actual = scene.getStats();
      near(actual.topLeft[0], entryEnd.topLeft[0], `${width}x${height} frame ${i}: X`);
      near(actual.topLeft[1], entryEnd.topLeft[1], `${width}x${height} frame ${i}: Y`);
      near(actual.fieldOfView, entryEnd.fieldOfView, `${width}x${height} frame ${i}: FOV`);
      if (JSON.stringify(scene.cells) !== cells) throw Error('visible array window changed on handoff');
    }
  }
  result.textContent = JSON.stringify({passed:true,count:checks.length,checks:checks.filter(name => !name.includes(" frame "))}, null, 2);
  result.dataset.passed = 'true';
} catch(error) {
  result.textContent = JSON.stringify({passed:false,checks,error:String(error)},null,2);
  result.dataset.passed = 'false';
}

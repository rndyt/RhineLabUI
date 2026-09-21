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
  result.textContent = JSON.stringify({passed:true,checks}, null, 2);
  result.dataset.passed = 'true';
} catch(error) {
  result.textContent = JSON.stringify({passed:false,checks,error:String(error)},null,2);
  result.dataset.passed = 'false';
}

  
  
  export function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
  }

  export function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
  }

  export function avg(arr) {
    var total = arr.reduce(function (sum, b) { return sum + b; });
    return (total / arr.length);
  }

  export function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); })
  }

  // Function to remove all objects from the scene
  export function removeAllObjectsFromScene(in_scene) {
    while (in_scene.children.length > 0) {
        var object = in_scene.children[0];
        in_scene.remove(object);
    }
}
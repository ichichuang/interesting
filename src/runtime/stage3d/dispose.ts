import type { Object3D, Material } from 'three'

export function disposeObject(obj: Object3D) {
  obj.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose()
    }
    if (child.material) {
      const material: any = child.material
      if (Array.isArray(material)) {
        material.forEach((m: Material) => m.dispose())
      } else {
        material.dispose()
      }
    }
  })
}

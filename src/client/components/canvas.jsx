import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import * as THREE from 'three';

const ITEMS_LIMIT = 1000;

class Canvas extends Component {
  constructor (props) {
    super(props);

    this.group = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.canvasRoot = null;
    this._animationFrameID = null;

    this.state = {
      rendered: null,
    };
  }

  componentDidUpdate () {
    const {
      imageName,
      needRefresh,
      needDisable,
     } = this.props;

    if (needDisable) {
      this.props.onDestroy();
      this.destroy();
    }
    if (needRefresh) {
      this.props.onRefreshed();
      this.restart();
    }
    if (imageName && imageName.length && this.state.rendered !== imageName) {
      this.restart();
      this.setState({ rendered: imageName });
      this.fetchAndRenderItems();
    }
  }

  restart () {
    this.destroy();

    this.init();
    this.animate();
    if (this.props.onCreate) {
      this.props.onCreate();
    }
  }

  destroy () {
    cancelAnimationFrame(this._animationFrameID);

    delete this.group;
    delete this.camera;
    delete this.scene;
    delete this.renderer;
    delete this.controls;

    if (this.canvasRoot) {
      this.canvasRoot.innerHTML = '';
    }

    if (this.props.onDestroy) {
      this.props.onDestroy();
    }
  }

  fetchAndRenderItems (offset=0, limit=ITEMS_LIMIT) {
    fetch(`http://localhost:4444/api/symbolic-images/${this.props.imageName}?offset=${offset}&limit=${limit}`, {
      method: 'GET',
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error('Render items: smth wrong');
        }
        return res.json();
      })
      .then((items) => {
        items.forEach((item) => this.addImageItem(item));

        if (items.length === limit) {
          this.fetchAndRenderItems(offset+limit, limit);
        }
      });
  }

  init () {
    const frustumSize = 500;
    const aspect = window.innerWidth/window.innerHeight;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.canvasRoot = document.querySelector('.canvas');
    this.canvasRoot.appendChild(this.renderer.domElement);

    this.camera = new THREE.OrthographicCamera(frustumSize*aspect/(-2), frustumSize*aspect/2, frustumSize/2, frustumSize/(-2), 1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);
    // this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    // this.camera.position.set(0, 0, 10);
    // this.camera.lookAt(0, 0, 0);
    // this.scene.add(this.camera);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 0;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI/2;

    this.scene.add(new THREE.AxesHelper(20));

    this.add2DSky();

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  addImageItem (item) {
    const geometry = new THREE.PlaneGeometry(item.d, item.d);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const plane = new THREE.Mesh(geometry, material);

    plane.position.set(item.startX + item.d/2, item.startY + item.d/2, 0);

    this.scene.add(plane);
  }

  add2DSky () {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const plane1 = new THREE.Mesh(geometry, material);
    const plane2 = new THREE.Mesh(geometry, material);
    const plane3 = new THREE.Mesh(geometry, material);
    const plane4 = new THREE.Mesh(geometry, material);
    const plane5 = new THREE.Mesh(geometry, material);
    const plane6 = new THREE.Mesh(geometry, material);

    plane2.rotation.set(new THREE.Vector3(0, 0, Math.PI));
    plane3.rotation.set(new THREE.Vector3(-Math.PI/2, 0, 0));
    plane4.rotation.x = Math.PI/2;
    plane5.rotation.y = -Math.PI/2;
    plane6.rotation.y = Math.PI/2;

    plane1.position.set(0, 0, -100);
    plane2.position.set(0, 0, 100);
    plane3.position.set(-100, 0, 0);
    plane4.position.set(100, 0, 0);
    plane5.position.set(0, -100, 0);
    plane6.position.set(0, 100, 0);

    this.scene.add(plane1);
    this.scene.add(plane2);
    // this.scene.add(plane3);
    // this.scene.add(plane4);
    // this.scene.add(plane5);
    // this.scene.add(plane6);
  }

  animate () {
    this._animationFrameID = requestAnimationFrame(() => this.animate());

    this.renderCanvas();
  }

  renderCanvas () {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize () {
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render () {
    return (
      <div className="canvas">
      </div>
    );
  }
}

Canvas.displayName = 'Canvas';

Canvas.propTypes = {
  imageName: PropTypes.string,
  onRefreshed: PropTypes.func,
  needRefresh: PropTypes.bool,
  needDisable: PropTypes.bool,
  onDestroy: PropTypes.func,
  onCreate: PropTypes.func,
};

export default Canvas;

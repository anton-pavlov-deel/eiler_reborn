import React, { Component } from 'react';
import ConfigPanel from './configPanel.jsx';
import Canvas from './canvas.jsx';

class App extends Component {
  constructor (props) {
    super(props);

    this.state = {
      images: [],
      renderImage: '',
      activeCanvas: false,
      canvasNeedRefresh: false,
    };
  }

  componentDidMount () {
    this.refreshImagesList();
  }

  renderImages () {
    const { images } = this.state;

    return images.map((image) => (
      <li className="images-list_item">
        <ol className="image-info list">
          <li className="image-info-item">
            {`Name: ${image.name}`}
          </li>
          <li className="image-info-item">
            {`Items count: ${image.itemsCount}`}
          </li>
          {
            image.morseSpectrum.sort((a, b) => (a.min.value > b.min.value ? 1 : -1))
              .map((interval, index) => (<li className="image-info-item" key={index}>{`[${index}] ${interval.min.value} : ${interval.max.value}`}</li>))
          }
          <a href="#" onClick={(e) => this.onDeleteClick(e, image.name)}>{' <Delete> '}</a>
          <a href="#" onClick={(e) => this.onRenderClick(e, image.name)}>{' <Render> '}</a>
        </ol>
      </li>
    ));
  }

  onDeleteClick (e, name) {
    e.preventDefault();
    this.deleteImage(name);
    return false;
  }

  onRenderClick (e, name) {
    e.preventDefault();
    this.setState(() => ({ renderImage: name }));
  }

  deleteImage (name) {
    fetch(`http://localhost:4444/api/symbolic-images/${name}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error(`Delete image: Smth wrong: Status ${res.status}`);
        }
        return true;
      })
      .then(() => this.refreshImagesList());
  }

  refreshImagesList () {
    fetch('http://localhost:4444/api/symbolic-images', {
      method: 'GET',
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error(`Fetch images: Smth wrong: Status ${res.status}`);
        }
        return res.json();
      })
      .then((images) => {
        console.log(images);
        this.setState(() => ({ images }))
      });
  }

  handleCreateImage () {
    this.refreshImagesList();
  }

  refreshCanvas () {
    this.setState(() => ({
      canvasNeedRefresh: true,
    }));
  }

  disableCanvas () {
    this.setState(() => ({
      canvasNeedDisable: true,
    }));
  }

  onCanvasRefreshed () {
    this.setState(() => ({
      canvasNeedRefresh: false,
    }));
  }

  onDisableCanvas () {
    this.setState(() => ({
      canvasNeedDisable: false,
    }));
  }

  render () {
    return (
      <div className="main-app">
        <h2 className="app-name">Eiler Reborn</h2>
        <div className="dashboard">

          <div className="images dashboard-part">
            <h3 className="sub-header">Images</h3>
            <ol className="images-list list">
              {this.renderImages()}
            </ol>
          </div>

          <div className="config dashboard-part">
            <h3 className="sub-header">Configuration</h3>
            <ConfigPanel
              onImageCreate={() => this.handleCreateImage()}
              onRefreshImages={() => this.refreshImagesList()}
              onRefreshCanvas={() => this.refreshCanvas()}
              onDisableCanvas={() => this.disableCanvas()}
              active={!this.state.activeCanvas}
            />
          </div>

        </div>
        <Canvas
          imageName={this.state.renderImage}
          onRefreshed={() => this.onCanvasRefreshed()}
          needRefresh={this.state.canvasNeedRefresh}
          needDisable={this.state.canvasNeedDisable}
          onCreate={() => this.setState(() => ({ activeCanvas: true }))}
          onDestroy={() => {
            this.onDisableCanvas();
            this.setState(() => ({ activeCanvas: false }));
          }}
        />
      </div>
    );
  }
}

export default App;

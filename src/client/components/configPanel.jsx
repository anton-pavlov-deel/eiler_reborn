import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Field from './formField.jsx';

class ConfigPanel extends Component {
  constructor (props) {
    super(props);

    this.state = {
      xFunction: '0.6 + 0.9*(x*cos(0.4 - 6/(1+x*x+y*y)) - y*sin(0.4 - 6/(1+x*x+y*y)))',
      yFunction: '0.9*( x*sin(0.4 - 6/(1+x*x+y*y)) + y*cos(0.4 - 6/(1+x*x+y*y)))',
      startX: -2,
      startY: -2,
      diameter: 2,
      width: 2,
      height: 2,
      iterations: 5,
      name: 'Default',
      mmc: false,
    };
  }

  handleInput (e) {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    if (type === 'checkbox') {
      this.setState(() => ({
        [name]: checked,
      }));
    } else {
      this.setState(() => ({
        [name]: value,
      }));
    }
  }

  handleCreateImage (e) {
    fetch('http://localhost:4444/api/symbolic-images', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state),
    })
      .then(async (res) => {
        if (res.status !== 200) {
          const responseText = await res.text();
          throw new Error(responseText);
        }
      })
      .then(() => this.props.onImageCreate());
  }

  handleRefreshImages (e) {
    this.props.onRefreshImages();
  }

  handleRefreshCanvas (e) {
    this.props.onRefreshCanvas();
  }

  handleDisableCanvas (e) {
    this.props.onDisableCanvas();
  }

  render () {
    return (
      <div className="config-panel">
        <div className="config-panel-form">
          <Field label="X function">
            <input
              name="xFunction"
              value={this.state.xFunction}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Y function">
            <input
              name="yFunction"
              value={this.state.yFunction}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Start X">
            <input
              name="startX"
              value={this.state.startX}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Start Y">
            <input
              name="startY"
              value={this.state.startY}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Width">
            <input
              name="width"
              value={this.state.width}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Height">
            <input
              name="height"
              value={this.state.height}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Cell diameter">
            <input
              name="diameter"
              value={this.state.diameter}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Iterations">
            <input
              name="iterations"
              value={this.state.iterations}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Image name">
            <input
              name="name"
              value={this.state.name}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <hr />
          <Field label="MMC">
            <input
              name="mmc"
              type="checkbox"
              checked={this.state.mmc}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
          <Field label="Projective slice">
            <input
              name="projectiveSlice"
              type="checkbox"
              checked={this.state.projectiveSlice}
              onChange={(e) => this.handleInput(e)}
              disabled={!this.props.active}
            />
          </Field>
        </div>
        <hr />
        <div className="config-panel-footer">
          <input
            type="button"
            value="Create image"
            onClick={(e) => this.handleCreateImage(e)}
            disabled={!this.props.active}
          />
          <input
            type="button"
            value="Refresh images"
            onClick={(e) => this.handleRefreshImages(e)}
          />
          <input
            type="button"
            value="Refresh canvas"
            onClick={(e) => this.handleRefreshCanvas(e)}
          />
          <input
            type="button"
            value="Disable canvas"
            onClick={(e) => this.handleDisableCanvas(e)}
          />
        </div>
      </div>
    );
  }
}

ConfigPanel.displayName = 'ConfigPanel';

ConfigPanel.propTypes = {
  onImageCreate: PropTypes.func,
  onRefreshImages: PropTypes.func,
  onRefreshCanvas: PropTypes.func,
  onDisableCanvas: PropTypes.func,
  active: PropTypes.bool,
};

export default ConfigPanel;

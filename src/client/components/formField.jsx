import React from 'react';
import PropTypes from 'prop-types';

const Field = (props) => (
  <div className="field">
    <div className="field-label">
      {`${props.label}: `}
    </div>
    <div className="field-content">
      {props.children}
    </div>
  </div>
);

Field.displayName = 'Field';

Field.propTypes = {
  label: PropTypes.string,
  children: PropTypes.element,
};

export default Field;

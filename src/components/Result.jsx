import React from 'react';
import PropTypes from 'prop-types';
// import { withStyles } from '@material-ui/core/styles';
// import classNames from 'classnames';
// import pink from '@material-ui/core/colors/pink';
import {CardResult} from './index';

class DetailedExpansionPanel extends React.Component {
  render() {
    const {
      classes,
      students,
      filterKey,
      handleStudentResolution,
      completed,
    } = this.props;

    return (
      <div>
        {
          students.map((item, idx) => {
            if (
                item["Student First"] &&
                item["Student First"] &&
                item["Account First"] &&
                item["Account First"] &&
                item["#"] &&
                item[filterKey] &&
                !item._ignore
              ) {
              return (
                <CardResult
                  item={item}
                  key={idx}
                  resolve={handleStudentResolution}
                  completed={completed}/>
               )
            }
            return null;
          })
        }
      </div>
    );
  }  
}

// DetailedExpansionPanel.propTypes = {
//   classes: PropTypes.object.isRequired,
// };

export default DetailedExpansionPanel;

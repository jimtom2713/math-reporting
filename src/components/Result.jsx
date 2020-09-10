import React from 'react';
import PropTypes from 'prop-types';
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
            console.log('-------------------------------------')
            console.log(item["Student First"])
            console.log(item["Student Last"])
            console.log(item["Account First"])
            console.log(item["Account Last"])
            console.log(item["#"])
            console.log(item[filterKey]);
            console.log(!item._ignore);
            console.log('-------------------------------------')
            if (
                item["Student First"] &&
                item["Student Last"] &&
                item["Account First"] &&
                item["Account Last"] &&
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

export default DetailedExpansionPanel;

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import LabelIcon from '@material-ui/icons/Label';

const drawerWidth = 240;

const styles = theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
  icon: {
  	color: '#ef3e33'
  }
});

class MenuDrawer extends React.Component {
	render() {
		const { classes, handleMenuSelection, selected } = this.props;
		
		return (
			<Drawer
			  className={classes.drawer}
			  variant="permanent"
			  classes={{
			    paper: classes.drawerPaper,
			  }}
			>
			  <div className={classes.toolbar} />
			  <List>
			    {['No settlement'].map((text, index) => (
			      <ListItem button key={text} selected={selected.key === text} onClick={event => handleMenuSelection(text)}>
			        <ListItemIcon><LabelIcon className={classes.icon}/></ListItemIcon>
			        <ListItemText primary={text} />
			      </ListItem>
			    ))}
			  </List>
			</Drawer>
		);
	}
}

MenuDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MenuDrawer);

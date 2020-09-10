import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import red from '@material-ui/core/colors/red';
import grey from '@material-ui/core/colors/grey';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Divider from '@material-ui/core/Divider';
import Chip from '@material-ui/core/Chip';

const styles = theme => ({
  card: {
    minWidth: 400,
    maxWidth: 400,
    // height: 200,
    margin: '6px',
    // float: 'left'
    display: 'inline-block',
    backgroundColor: grey[100],
  },
  cardNotResolved: {
    border: `2px solid #ef3e33`,
    backgroundColor: 'inherit',
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  actions: {
    display: 'flex',
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  chip: {
    backgroundColor: grey[300],
    margin: theme.spacing.unit,
  },
  divider: {
    margin: '10px 0px',
  },
  resolveButton: {
    '&:hover': {
      backgroundColor: '#c69214',
    }
  }
});

class RecipeReviewCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    }
    this.handleExpandClick = this.handleExpandClick.bind(this);
    this.handleResolveClick = this.handleResolveClick.bind(this);
  }

  handleExpandClick() {
    this.setState(state => ({ expanded: !state.expanded }));
  };

  handleResolveClick(id) {
    this.props.resolve(id);
  }

  render() {
    const { classes, item, completed } = this.props;
    const { expanded } = this.state;
    const resolved = completed.indexOf(item._uuid) !== -1;
    return (
      <Card
        className={classnames(classes.card, {
          [classes.cardNotResolved]: !resolved,
        })}>
        <CardHeader
          action={
            <IconButton onClick={() => { return this.handleResolveClick(item._uuid); }} className={classes.resolveButton}>
              <Typography variant="caption">{resolved ? 'Undo' : 'Resolve'}</Typography>
            </IconButton>
          }
          title={`${item["Account First"]} ${item["Account Last"]}`}
          subheader={`${item["Student First"]} ${item["Student Last"]}`}
        />
        <CardActions className={classes.actions} disableActionSpacing>
          <IconButton
            className={classnames(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={this.handleExpandClick}
            aria-expanded={expanded}
            aria-label="Show more"
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography variant="caption" component="span">
              { item["Notes"] ? `${item["Notes"]}` : 'No student notes'}
            </Typography>
              <Divider className={classes.divider}/>
              <Typography variant="caption" component="span">
              { item["Recurring"] }
              </Typography>
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

RecipeReviewCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(RecipeReviewCard);

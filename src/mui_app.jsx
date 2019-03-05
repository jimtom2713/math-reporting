import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import classnames from 'classnames';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import XLSX from 'xlsx';
import MenuIcon from '@material-ui/icons/Menu';
import uuid from 'node-uuid'
import {Result, MenuDrawer} from './components'
import grey from '@material-ui/core/colors/grey';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    background: grey[700],
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
  },
  	toolbar: theme.mixins.toolbar,
	goButton: {
		margin: theme.spacing.unit,
		color: "white",
		background: grey[700],
	},
	uploadComplete: {
		margin: theme.spacing.unit,
		color: "white",
		background: '#499A36',
	},
  button: {
		margin: theme.spacing.unit,
		background: '#003563',
		color: "white",
	},
	leftIcon: {
		marginRight: theme.spacing.unit,
	},
	rightIcon: {
		marginLeft: theme.spacing.unit,
	},
});

const STUDENTS_WITHOUT_EXPECTED_PAYMENTS = [
			"sienna chan",
			"lilly campos",
			"ciaran o'donnell",
		];

class ClippedDrawer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			settlementFile: null,
			studentFile: null,
			students: [],
			selectedMenuItem: {
				key: 'No settlement',
				field: '_settlement',
			},
			open: false,
			completed: [],
		}

		this.setFile = this.setFile.bind(this);
		this.processStudents = this.processStudents.bind(this);
		this.handleMenuSelection = this.handleMenuSelection.bind(this);
		this.checkFailedPayment = this.checkFailedPayment.bind(this);
		this.checkForSettlement = this.checkForSettlement.bind(this);
		this.handleStudentResolution = this.handleStudentResolution.bind(this);
		this.handleClose = this.handleClose.bind(this);
		this.transition = this.transition.bind(this);
		this.checkForCashPayment = this.checkForCashPayment.bind(this);
		this.reset = this.reset.bind(this);
	}

	handleStudentResolution(id) {
		const records = this.state.completed;
		if(records.indexOf(id) !== -1) {
			records.splice(records.indexOf(id), 1);
		} else {
			records.push(id);
		}
		this.setState({
			completed: records,
		})
	}

	checkFailedPayment(record, data) {
		if (record["Account First"] && record["Account Last"]) {
			const account = `${record["Account First"].trim().toLowerCase()} ${record["Account Last"].trim().toLowerCase()}`
			return data.find((f,i) => {
				if(f["Name"] && f["Name"].trim().toLowerCase() === account) {
					return f["Name"].trim().toLowerCase() === account
				}
			})
		}
	}

	checkForSettlement(record, data) {
		let found = false;
		let i = 0;
		if (record["Account First"] && record["Account Last"]) {

			const account = `${record["Account Last"].trim().toLowerCase()}, ${record["Account First"].trim().toLowerCase()}`
			while(!found && i < data.length) {
					found = data[i].find((f, k) => {
						if (f["Customer"] && f["Customer"].trim().toLowerCase() === account) {
							return f["Customer"].trim().toLowerCase() === account
						}
					})
					i = i + 1;
			}
			return found;
		}
	}

	checkForCashPayment(record) {
		if (record["Account First"] && record["Account Last"]) {
			const _cash = new RegExp('cash');
			return _cash.test(record["Recurring"].toLowerCase());
		}
		return false;
	}

	ignore(s) {
		if (s["Student Last"] && s["Student First"]) {
			return STUDENTS_WITHOUT_EXPECTED_PAYMENTS.includes(`${s["Student First"].trim().toLowerCase()} ${s["Student Last"].trim().toLowerCase()}`)
		}
	}

	processStudents() {
		const {studentFile, settlementFile} = this.state;
		if (!studentFile || !settlementFile) {
			this.setState(state => ({ open: true }));
			return;
		}

		let students = XLSX.readFile(studentFile.path, {raw: false})
		students = XLSX.utils.sheet_to_json(students.Sheets['Student Roster']);

		let failedPayments = XLSX.readFile(settlementFile.path, {raw: false})
		failedPayments = XLSX.utils.sheet_to_json(failedPayments.Sheets['Failed Payments'], {
			range: 1,
			header: [
				"",
				"Name",
				"Amount",
				"Last4 CC",
				"Response",
				"Response Text",
				"Date",
				"Auth Code",
				"AVS Response",
				"Card Type",
				"CVV Response"
			]
		});

		let settlementSheet = XLSX.readFile(settlementFile.path, {raw: false})
		const settlements = XLSX.utils.sheet_to_json(settlementSheet.Sheets['SettlementReport'], {
			range: 1,
			header: [
				"",
				"Payer's Name",
				"Amount",
				"Confirmation #",
				"Last4 CC",
				"Card Type",
				"Payment Date",
				"Recurring",
				"Customer"
			],
		});

		const radius_ach_tab = XLSX.utils.sheet_to_json(settlementSheet.Sheets['ACH'], {
			range: 1,
			header: [
				"",
				"Payer's Name",
				"Amount",
				"Confirmation #",
				"Card Type",
				"Payment Date",
				"Recurring",
				"Customer"
			],
		}); // from Radius Report

		const radius_amex_tab = XLSX.utils.sheet_to_json(settlementSheet.Sheets['Amex'], {
			range: 1,
			header: [
				"",
				"Payer's Name",
				"Amount",
				"Confirmation #",
				"Last4 CC",
				"Card Type",
				"Payment Date",
				"Recurring",
				"Customer"
			],
		}); // from Radius Report

		students.forEach((s,i) => {
			s._failed = this.checkFailedPayment(s, failedPayments);
			s._settlement = !this.checkForSettlement(s, [settlements, radius_ach_tab, radius_amex_tab]);
			s._resolved = false;
			s._uuid = uuid();
			s._ignore = this.ignore(s);
			s._cash = this.checkForCashPayment(s);
			console.log(s._cash);
		})
		this.setState({
			students
		})
	}

	setFile(file, type) {
		const _s = {};
		_s[type] = file
		this.setState(_s);
	}

	handleMenuSelection(selection) {
		let selectedMenuItem = null;
		switch (selection) {
			// case 'All students':
			// 	selectedMenuItem = { key: selection, field: 'Account First' }
			// 	break;
			case 'No settlement':
				selectedMenuItem = { key: selection, field: '_settlement' }
				break;
			case 'Failed payments':
				selectedMenuItem = { key: selection, field: '_failed' }
				break;
			default:
				break;
		}
		this.setState({ selectedMenuItem })
	}

	handleClose() {
		this.setState(state => ({ open: false }));
	}

	transition(props) {
	  return <Slide direction="up" {...props} />;
	}

	reset() {
		this.setState({
			settlementFile: null,
			studentFile: null,
			students: [],
			selectedMenuItem: {
				key: 'No settlement',
				field: '_settlement',
			},
			open: false,
			completed: [],
		})
	}

	render() {
		const { classes } = this.props;
		const {settlementFile, studentFile, selectedMenuItem, students, completed} = this.state;
		return (
		  <div className={classes.root}>
		    <CssBaseline />
		    <AppBar position="fixed" className={classes.appBar}>
		      <Toolbar>
		        <Typography variant="h6" color="inherit" noWrap>
		          Mathnasium
		        </Typography>
		        <input
		          style={{ display: 'none' }}
		          id="raised-button-file-students"
		          type="file"
		          onChange={(file) => { return this.setFile(file.target.files[0], 'studentFile') }}
		        />
		        <label htmlFor="raised-button-file-students">
		          <Button
		          	variant="contained"
		          	component="span"
		          	className={!studentFile ? classes.button : classes.uploadComplete}>
		          	Student Checklist
		            <CloudUploadIcon className={classes.rightIcon}/>
		          </Button>
		        </label>
		        <input
		          style={{ display: 'none' }}
		          id="raised-button-file-payments"
		          type="file"
		          onChange={(file) => { return this.setFile(file.target.files[0], 'settlementFile') }}
		        />
		        <label htmlFor="raised-button-file-payments">
		          <Button variant="contained" component="span" className={!settlementFile ? classes.button : classes.uploadComplete}>
		          	Settlement Report
		            <CloudUploadIcon className={classes.rightIcon}/>
		          </Button>
		        </label>
		        <Button variant="contained" component="span" className={!settlementFile || !studentFile ? classes.button : classes.uploadComplete} onClick={this.processStudents}>Go</Button>
		       	{/*<Button variant="contained" component="span" className={classes.uploadComplete} onClick={this.reset}>Reset</Button>*/}
		        <div>
		                <Dialog
		                  open={this.state.open}
		                  TransitionComponent={this.transition}
		                  keepMounted
		                  onClose={this.handleClose}
		                  aria-labelledby="alert-dialog-slide-title"
		                  aria-describedby="alert-dialog-slide-description"
		                >
		                  <DialogTitle id="alert-dialog-slide-title">
		                    {"Please upload files"}
		                  </DialogTitle>
		                  <DialogContent>
		                    <DialogContentText id="alert-dialog-slide-description">
		                      Please upload the student checklist and settlement files first...
		                    </DialogContentText>
		                  </DialogContent>
		                  <DialogActions>
		                    <Button onClick={this.handleClose} color="primary">
		                      Agree
		                    </Button>
		                  </DialogActions>
		                </Dialog>
		              </div>


		      </Toolbar>
		    </AppBar>
		    <MenuDrawer selected={selectedMenuItem} handleMenuSelection={this.handleMenuSelection}/>
		    <main className={classes.content}>
		      <div className={classes.toolbar} />
		      <Result students={students} filterKey={selectedMenuItem.field} handleStudentResolution={this.handleStudentResolution} completed={completed}/>
		    </main>
		  </div>
		);
	}
}

ClippedDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ClippedDrawer);

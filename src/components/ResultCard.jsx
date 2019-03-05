import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import ListGroupItem from 'react-bootstrap/ListGroupItem';
import Collapse from 'react-bootstrap/Collapse'

const styles = {
	card: {
		normal: {
			width: '75%',
			margin: '20px auto',
		}
	},
	header: {
		normal: {
			float: 'left',
			margin: '0px 20px 0px 20px',
		}
	},
	container: {
		normal: {
			padding: '10px 0px',
			position: 'fixed',
			top: '0px',
			'zIndex': '10',
			width: '75%',
			'background': '#f4f9f4'
		}
	},
	button: {
		normal: {
			float: 'right',
			margin: '10px 40px 10px 0px',
		}
	}
}

export default class ResultCard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			__completedRecords__: [],
			_resolveToggle: false
		}
		this.changeStatus = this.changeStatus.bind(this);
		this.changeRecordVisibility = this.changeRecordVisibility.bind(this);
	}

	changeStatus(rec) {
		const _completed = this.state.__completedRecords__;
		if(_completed.indexOf(rec.__uuid) !== -1) {
			_completed.splice(_completed.indexOf(rec.__uuid), 1);
		} else {
			_completed.push(rec.__uuid);
		}
		this.setState({
			__completedRecords__: _completed,
		})
	}

	changeRecordVisibility() {
		const {_resolveToggle} = this.state;
		this.setState({
			_resolveToggle: !_resolveToggle
		})
	}

	render() {
		const { entries, title } = this.props;
		const { __completedRecords__, _resolveToggle } = this.state;
		if (entries.length === 0) {
			return (
				<span>{'No records found matching criteria'}</span>
			);
		};

		return (
			<div>
				<div style={styles.container.normal}>
					<div>{title}</div>
					<div>
						<div style={styles.header.normal}>
							<div style={{'textAlign': 'center'}}><span style={{'fontSize': '32px'}}>{entries.length}</span></div>
							<div>{'Records Found'}</div>
						</div>
						<div style={styles.header.normal}>
							<div style={{'textAlign': 'center'}}><span style={{'fontSize': '32px'}}>{entries.length - __completedRecords__.length}</span></div>
							<div>{'Records Remaining'}</div>
						</div>
					</div>
					<div style={styles.button.normal}>
						<Button
							onClick={this.changeRecordVisibility}
							variant={"outline-primary"}
						>
							{`${_resolveToggle ? 'Show' : 'Hide'} resolved records`}
						</Button>
					</div>
				</div>
				<div style={{'marginTop': '140px'}}>
					{
						entries.map((record, i) => {
							const _complete = __completedRecords__.indexOf(record.__uuid) !== -1;
							if (_complete && _resolveToggle) {
								return null
							}

							return (
									<Card key={i} style={styles.card.normal} border={_complete ? 'success' : 'danger'}>
								<Collapse in={!_complete}>
										<Card.Body>
												<Card.Title>{`Account Name: ${record['Account First']} ${record['Account Last']}`}</Card.Title>
												<Card.Title>{`Student Name: ${record['Student First']} ${record['Student Last']}`}</Card.Title>
												{record.__failed && <Card.Text>{'Failed Payment'}</Card.Text>}
												{record.__cash && <Card.Text>{'Cash Payment'}</Card.Text>}
												{record['Notes'] && <Card.Text>{`Membership Notes: ${record['Notes']}`}</Card.Text>}
												{record['Recurring'] && <Card.Text>{`Recurring Payment: ${record['Recurring']}`}</Card.Text>}
										</Card.Body>
								</Collapse>
										<Card.Footer>
											<Button variant={_complete ? 'success' : 'danger'} onClick={() => { this.changeStatus(record)}}>
												{_complete ? 'Complete' : 'Resolve'}
											</Button>
										</Card.Footer>
									</Card>
							);
						})
					}
				</div>
			</div>
		);
	}
}

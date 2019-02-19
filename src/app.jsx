import React from 'react';
import XLSX from 'xlsx';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
	
class ReconcileButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			done: false
		}
		this.changeStatus = this.changeStatus.bind(this);
	}

	changeStatus() {
		const { done } = this.state;
		this.setState({
			done: !done
		})
	};

	render() {
		const { done } = this.state;
		return (
			<Button variant={done ? 'success' : 'danger'} onClick={this.changeStatus}>?</Button>
		);
	}
}

class Item extends React.Component {
	render() {
		const { entries } = this.props;

		if (entries.length === 0) {
			return (
				<span>{'No records found matching criteria'}</span>
			);
		};

		return (
			<Table>
				<thead>
					<tr>
						<th>{'Complete'}</th>
						<th>{'Student'}</th>
						<th>{'Account'}</th>
					</tr>
				</thead>
				<tbody>
					{
						entries.map((record, i) => {
							return (
								<tr key={i}>
									<td><ReconcileButton/></td>
									<td>{`${record['Student First']} ${record['Student Last']}`}</td>
									 <td>{`${record['Account First']} ${record['Account Last']}`}</td>
								</tr>
							)
						})
					}
				</tbody>
			</Table>
		);
	}
}


export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			NO_ACCOUNT_SETTLEMENT: [],
			NO_RECURRING_SETTLEMENT: [],
			NO_PAYMENT_FOR_STUDENT: [],
			key: 'home'
		}
		this.__main__ = this.__main__.bind(this);
		this.__reset__ = this.__reset__.bind(this);
	}

	__main__() {
		var __NO_ACCOUNT_SETTLEMENT__ = [];
		var __NO_RECURRING_SETTLEMENT__ = [];
		var __NO_PAYMENT_FOR_STUDENT__ = [];
		var params = {
			raw: false
		}

		var STUDENTS_WITHOUT_EXPECTED_PAYMENTS = [
			"Sienna Chan",
			"Lilly Campos",
			"Ciaran O'Donnell",
		];

		/*
			Load raw data from workbooks
		*/

		/**
		 * New Student Checklist
		 * Sheets: [ 'Student Roster', 'Private Tutoring', 'First Steps', 'Scholarship', 'Cash Payments' ]
		 */
		var raw_student_checklist = XLSX.readFile('./data/student_checklist.xlsx', params);

		/**
		 * Student Payment Schedule
		 * Sheets: [ 'SettlementReport', 'ACH', 'Amex', 'Failed Payments' ]
		 */
		var raw_payment_settlement = XLSX.readFile('./data/settlement.xlsx', params);

		/*
			Extract specific sheets from each workbook (multilple sheets)
		*/
		var student_roster_sheet = XLSX.utils.sheet_to_json(raw_student_checklist.Sheets['Student Roster']); // from New Student Checklist

		var settlement_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		var settlement_report_sheet = XLSX.utils.sheet_to_json(raw_payment_settlement.Sheets['SettlementReport'], settlement_params); // from Settlement Report

		/**
		 * Check for recurring payment setup in settlement sheet
		 * Params:
		 * {settlement}: settlement record
		 */
		function __check__for__recurring__payment__(settlement) {
			return !!settlement['Recurring'];
		}

		/**
		 * Check for studdent name in list of recurring student names
		 * Params:
		 * {names}: string of names in recurring payments
		 * {student}: student name to look for
		 */
		function __check__for__student__name__(names, student) {
			if (student && names) {
				var __student__name__ = new RegExp(student);
				return __student__name__.test(names.toLowerCase());
			}
		}

		/**
		 * Return the settlement record from payments or return no record
		 * Params:
		 * {record_key}: key to join students with settlements (Account First + Account Last)
		 * {settlement_records}: settlement records from payment system
		 */
		function __find__settlement_record__(record_key, settlement_records) {
			return settlement_records.find(function(record, i) {
				// TO DO: take in generic param for key field to reconcile sheets in JOIN
				return record["Customer"] && record_key === record["Customer"].trim().toLowerCase() && record["Card Type"] !== 'refund';
			})
		}

		/**
		 * Find student records that we want to reconcile.
		 * Return student record or undefined. Do not include account first/last name missing.
		 * Params:
		 * {record}: student record
		 * {settlement_records}: settlement records from payment system
		 */
		function __valid__student__record__(record) {
			var student_name = record["Student First"] + ' ' + record["Student Last"];
			return record['Account First'] && // Account first name must be included
				record['Account Last'] && // Account last name must be included
				record['#'] &&
				!STUDENTS_WITHOUT_EXPECTED_PAYMENTS.includes(student_name) &&
				record;
		}

		for (var i=0; i<student_roster_sheet.length; i++) {
			const account_name = __valid__student__record__(student_roster_sheet[i]);
			if (account_name) {
				var settlement_record = __find__settlement_record__(account_name['Account Last'].trim().toLowerCase() + ', ' + account_name['Account First'].trim().toLowerCase(), settlement_report_sheet)
				if (settlement_record) {
					// There is a settlement record found.
					// Check for a recurring payment field
					if (__check__for__recurring__payment__(settlement_record)) {
						// Check for student in recurring field
						__check__for__student__name__(settlement_record['Recurring'], account_name['Student First'].trim().toLowerCase()) ? null : __NO_PAYMENT_FOR_STUDENT__.push(account_name);
					} else {
						// Settlement record found but no recurring payment fields
						__NO_RECURRING_SETTLEMENT__.push(account_name);
					}
				} else {
					// No settlement record found.
					__NO_ACCOUNT_SETTLEMENT__.push(account_name);
				}
			}
		}

		this.setState({
			NO_ACCOUNT_SETTLEMENT: __NO_ACCOUNT_SETTLEMENT__,
			NO_RECURRING_SETTLEMENT: __NO_RECURRING_SETTLEMENT__,
			NO_PAYMENT_FOR_STUDENT: __NO_PAYMENT_FOR_STUDENT__,
		})
	}

	__reset__() {
		this.setState({
			NO_ACCOUNT_SETTLEMENT: [],
			NO_RECURRING_SETTLEMENT: [],
			NO_PAYMENT_FOR_STUDENT: [],
		})
	}

	render() {
		return (
			<div>
				<h1>Math is fun</h1>
				<button onClick={this.__main__}>{'Run the thing'}</button>
				<button onClick={this.__reset__}>{'Reset'}</button>
				<Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
				  <Tab eventKey="home" title="No Settlement Record">
				    <Item entries={this.state.NO_ACCOUNT_SETTLEMENT}/>
				  </Tab>
				  <Tab eventKey="profile" title="No Recurring Payment">
				    <Item entries={this.state.NO_RECURRING_SETTLEMENT}/>
				  </Tab>
				  <Tab eventKey="contact" title="Student Missing in Recurring Payment">
				    <Item entries={this.state.NO_PAYMENT_FOR_STUDENT}/>
				  </Tab>
				</Tabs>
			</div>
		);
	}
}

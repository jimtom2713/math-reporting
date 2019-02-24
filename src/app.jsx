import React from 'react';
import XLSX from 'xlsx';
import uuid from 'node-uuid'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { ResultCard } from './components';

const styles = {
	header: {
		normal: {
			background: '#000000',
			padding: '0px',
			position: 'fixed',
			height: '100%',
		}
	},
	body: {
		normal: {
			position: 'fixed',
			left: '25%',
			height: '100%',
			overflow: 'scroll',
		}
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
		var radius_report = XLSX.readFile('./data/settlement.xlsx', params);

		const radius_settlement_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_settlement_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['SettlementReport'], radius_settlement_params); // from Radius Report

		const radius_ach_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_ach_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['ACH'], radius_ach_params); // from Radius Report

		const radius_amex_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_amex_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['Amex'], radius_amex_params); // from Radius Report
/*
		const radius_failed_payments_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_failed_payments_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['Failed Payments'], radius_failed_payments_params); // from Radius Report*/

		/*
			Extract specific sheets from each workbook (multilple sheets)
		*/
		var student_roster_sheet = XLSX.utils.sheet_to_json(raw_student_checklist.Sheets['Student Roster']); // from New Student Checklist


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
				const lookupKey = account_name['Account Last'].trim().toLowerCase() + ', ' + account_name['Account First'].trim().toLowerCase();
				const settlement_record = 
					__find__settlement_record__(lookupKey, radius_settlement_tab) ||
					__find__settlement_record__(lookupKey, radius_ach_tab) ||
					__find__settlement_record__(lookupKey, radius_amex_tab);

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

	componentDidMount() {
		this.__main__();
	}

	render() {
		const {
			NO_ACCOUNT_SETTLEMENT,
			NO_RECURRING_SETTLEMENT,
			NO_PAYMENT_FOR_STUDENT,
		} = this.state;

		[
			NO_ACCOUNT_SETTLEMENT,
			NO_RECURRING_SETTLEMENT,
			NO_PAYMENT_FOR_STUDENT,
		].forEach((g,i) => {
			g.forEach((item, idx) => {
				item.__uuid = uuid();
			})
		})

		return (
			<Tab.Container defaultActiveKey="account">
			  <Row>
			    <Col sm={3} style={styles.header.normal}>
			      <Nav className="flex-column" justify>
			      	{[
						{key: 'account' , title: 'No Settlement Record', data: NO_ACCOUNT_SETTLEMENT },
						{key: 'recurring', title: 'No Recurring Payment', data: NO_RECURRING_SETTLEMENT },
						{key: 'payment', title: 'Student Missing in Recurring Payment', data: NO_PAYMENT_FOR_STUDENT }
					].map((entry, idx)=> {
						return (
							<Nav.Item key={entry.key}>
								<Nav.Link eventKey={entry.key}>{entry.title}</Nav.Link>
							</Nav.Item>
						);
					})}
			      </Nav>
			    </Col>
			    <Col sm={9} style={styles.body.normal}>
			      <Tab.Content>
			      	{[
						{key: 'account' , title: 'No Settlement Record', data: NO_ACCOUNT_SETTLEMENT },
						{key: 'recurring', title: 'No Recurring Payment', data: NO_RECURRING_SETTLEMENT },
						{key: 'payment', title: 'Student Missing in Recurring Payment', data: NO_PAYMENT_FOR_STUDENT }
					].map((entry, idx)=> {
						return (
							<Tab.Pane eventKey={entry.key} key={entry.key}>
							  <ResultCard entries={entry.data} title={entry.title}/>
							</Tab.Pane>
						);
					})}
			      </Tab.Content>
			    </Col>
			  </Row>
			</Tab.Container>
		);
	}
}

import React from 'react';
import XLSX from 'xlsx';
import uuid from 'node-uuid'

import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { ResultCard } from './components';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			NO_ACCOUNT_SETTLEMENT: [],
			NO_RECURRING_SETTLEMENT: [],
			NO_PAYMENT_FOR_STUDENT: [],
			FAILED_PAYMENT: [],
			menu: 'account',
			radius_file: null,
			student_checklist: null,
			ready: false,
			completeRecords: [],
		}
		this.__main__ = this.__main__.bind(this);
		this.__reset__ = this.__reset__.bind(this);
		this.changeRecordStatus = this.changeRecordStatus.bind(this);
	}

	__main__() {
		const { radius_file, student_checklist } = this.state;
		const __NO_ACCOUNT_SETTLEMENT__ = [];
		const __NO_RECURRING_SETTLEMENT__ = [];
		const __NO_PAYMENT_FOR_STUDENT__ = [];
		const __FAILED_PAYMENT__ = [];
		const params = {
			raw: false
		}

		const STUDENTS_WITHOUT_EXPECTED_PAYMENTS = [
			"sienna chan",
			"lilly campos",
			"ciaran o'donnell",
		];

		if (!radius_file && !student_checklist) {
			return null;
		}

		/*
			Load raw data from workbooks
		*/

		/**
		 * New Student Checklist
		 * Sheets: [ 'Student Roster', 'Private Tutoring', 'First Steps', 'Scholarship', 'Cash Payments' ]
		 */
		const raw_student_checklist = XLSX.readFile(student_checklist.path, params);

		/**
		 * Student Payment Schedule
		 * Sheets: [ 'SettlementReport', 'ACH', 'Amex', 'Failed Payments' ]
		 */
		const radius_report = XLSX.readFile(radius_file.path, params);

		const radius_settlement_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_settlement_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['SettlementReport'], radius_settlement_params); // from Radius Report

		const radius_ach_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_ach_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['ACH'], radius_ach_params); // from Radius Report
		const radius_amex_params = {
			range: 1,
			header: ["", "Payer's Name", "Amount", "Confirmation #", "Last4 CC", "Card Type", "Payment Date", "Recurring", "Customer"],
		}
		const radius_amex_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['Amex'], radius_amex_params); // from Radius Report
        
		const radius_failed_payments_params = {
			range: 1,
			header: ["", "Name", "Amount", "Last4 CC", "Response", "Response Text", "Date", "Auth Code", "AVS Response", "Card Type", "CVV Response"],
		}
		const radius_failed_payments_tab = XLSX.utils.sheet_to_json(radius_report.Sheets['Failed Payments'], radius_failed_payments_params); // from Radius Report
		/*
			Extract specific sheets from each workbook (multilple sheets)
		*/
		const student_roster_sheet = XLSX.utils.sheet_to_json(raw_student_checklist.Sheets['Student Roster']); // from New Student Checklist

		function __check__failed__payment__(name) {
			return !!radius_failed_payments_tab.find((k,i) => {
				if (k["Name"]) {
					return k["Name"].trim().toLowerCase() === name;
				}
			})
		}

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
		function __find__settlement_record__(record_key, settlement_records, type) {
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
			if (record["Student First"] && record["Student Last"]) {
				const student_name = record["Student First"].trim().toLowerCase() + ' ' + record["Student Last"].trim().toLowerCase();
				return record['Account First'] && // Account first name must be included
					record['Account Last'] && // Account last name must be included
					record['#'] &&
					!STUDENTS_WITHOUT_EXPECTED_PAYMENTS.includes(student_name) &&
					record;
			}
			return false;
		}

		function __check__Cash__payment__(record) {
			if (record["Recurring"]) {
				var cash_payment = new RegExp('cash');
				return cash_payment.test(record["Recurring"].toLowerCase());
			}
		}

		for (var i=0; i<student_roster_sheet.length; i++) {
			const account_name = __valid__student__record__(student_roster_sheet[i]);
			if (account_name) {
				const lookupKey = account_name['Account Last'].trim().toLowerCase() + ', ' + account_name['Account First'].trim().toLowerCase();
				const settlement_record = 
					__find__settlement_record__(lookupKey, radius_settlement_tab, 'settlement') ||
					__find__settlement_record__(lookupKey, radius_ach_tab, 'ach') ||
					__find__settlement_record__(lookupKey, radius_amex_tab, 'amex');

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

		[
			__NO_ACCOUNT_SETTLEMENT__,
			__NO_RECURRING_SETTLEMENT__,
			__NO_PAYMENT_FOR_STUDENT__,
			__FAILED_PAYMENT__,
		].forEach((g,i) => {
			g.forEach((item, idx) => {
				const account_name = `${item["Account First"].trim().toLowerCase()} ${item["Account Last"].trim().toLowerCase()}`;
				item.__failed = __check__failed__payment__(account_name);
				item.__cash = __check__Cash__payment__(item);
				item.__uuid = uuid();
			})
		})

		this.setState({
			NO_ACCOUNT_SETTLEMENT: __NO_ACCOUNT_SETTLEMENT__,
			NO_RECURRING_SETTLEMENT: __NO_RECURRING_SETTLEMENT__,
			NO_PAYMENT_FOR_STUDENT: __NO_PAYMENT_FOR_STUDENT__,
			FAILED_PAYMENT: __FAILED_PAYMENT__,
		})
	}

	changeRecordStatus(rec) {
		const _completed = this.state.completeRecords;
		if(_completed.indexOf(rec.__uuid) !== -1) {
			_completed.splice(_completed.indexOf(rec.__uuid), 1);
		} else {
			_completed.push(rec.__uuid);
		}
		this.setState({
			completeRecords: _completed,
		})
	}

	__reset__() {
		this.setState({
			NO_ACCOUNT_SETTLEMENT: [],
			NO_RECURRING_SETTLEMENT: [],
			NO_PAYMENT_FOR_STUDENT: [],
			FAILED_PAYMENT: [],
		})
	}

	render() {
		const {
			NO_ACCOUNT_SETTLEMENT,
			NO_RECURRING_SETTLEMENT,
			NO_PAYMENT_FOR_STUDENT,
			FAILED_PAYMENT,
			radius_file,
			student_checklist,
			ready,
			menu,
			completeRecords
		} = this.state;

		if(!ready) {
			return (
				<div>
					<div>
						<label htmlFor="student_fileInput">Upload Student Checklist :</label>
						<input type="file" id="student_fileInput" name="Student Checklist" onChange={(e) => { this.setState({student_checklist: e.target.files[0]})}}/>
					</div>
					<div>
						<label htmlFor="radius_fileInput">Upload Radius Payments :</label>
						<input type="file" id="radius_fileInput" name="Radius Checklist" onChange={(e) => { this.setState({radius_file: e.target.files[0]})}}/>
					</div>
					<Button onClick={() => {
						if(radius_file && student_checklist) {
							this.__main__()
							this.setState({ ready: true })
						}
					}}>Go</Button>
				</div>
			);
		}

		const data = [
			{key: 'account' , title: 'Missing Settlement Record', data: NO_ACCOUNT_SETTLEMENT },
			{key: 'recurring', title: 'Non-Recurring K-8 Payments', data: NO_RECURRING_SETTLEMENT },
			{key: 'payment', title: 'Payments With Unexpected Recurring Name', data: NO_PAYMENT_FOR_STUDENT },
		]

		return (
			<Tab.Container defaultActiveKey="account" onSelect={key => this.setState({menu: key})}>
			  <Row>
			    <Col sm={3} className="menu">
			      <Nav className="flex-column">
			      	{data.map((entry, idx)=> {
						return (
							<Nav.Item key={entry.key} className={entry.key === menu ? "selected" : "not-selected"}>
								<Nav.Link eventKey={entry.key}>{entry.title}</Nav.Link>
							</Nav.Item>
						);
					})}
			      </Nav>
			    </Col>
			    <Col sm={9} className="body">
			      <Tab.Content>
			      	{data.map((entry, idx)=> {
			      	return (
			      		<Tab.Pane eventKey={entry.key} key={entry.key}>
			      		  <ResultCard entries={entry.data} title={entry.title} changeRecordStatus={this.changeRecordStatus} completeRecords={completeRecords}/>
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

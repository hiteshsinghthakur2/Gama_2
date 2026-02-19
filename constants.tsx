
import { CRAFT_DADDY_LOGO_URL } from './assets/brand';

export const INDIAN_STATES = [
  { name: 'Jammu and Kashmir', code: '01', pincodeStart: '18', capital: 'Srinagar' },
  { name: 'Himachal Pradesh', code: '02', pincodeStart: '17', capital: 'Shimla' },
  { name: 'Punjab', code: '03', pincodeStart: '14', capital: 'Chandigarh' },
  { name: 'Chandigarh', code: '04', pincodeStart: '16', capital: 'Chandigarh' },
  { name: 'Uttarakhand', code: '05', pincodeStart: '24', capital: 'Dehradun' },
  { name: 'Haryana', code: '06', pincodeStart: '12', capital: 'Chandigarh' },
  { name: 'Delhi', code: '07', pincodeStart: '11', capital: 'New Delhi' },
  { name: 'Rajasthan', code: '08', pincodeStart: '30', capital: 'Jaipur' },
  { name: 'Uttar Pradesh', code: '09', pincodeStart: '20', capital: 'Lucknow' },
  { name: 'Bihar', code: '10', pincodeStart: '80', capital: 'Patna' },
  { name: 'Sikkim', code: '11', pincodeStart: '73', capital: 'Gangtok' },
  { name: 'Arunachal Pradesh', code: '12', pincodeStart: '79', capital: 'Itanagar' },
  { name: 'Nagaland', code: '13', pincodeStart: '79', capital: 'Kohima' },
  { name: 'Manipur', code: '14', pincodeStart: '79', capital: 'Imphal' },
  { name: 'Mizoram', code: '15', pincodeStart: '79', capital: 'Aizawl' },
  { name: 'Tripura', code: '16', pincodeStart: '79', capital: 'Agartala' },
  { name: 'Meghalaya', code: '17', pincodeStart: '79', capital: 'Shillong' },
  { name: 'Assam', code: '18', pincodeStart: '78', capital: 'Dispur' },
  { name: 'West Bengal', code: '19', pincodeStart: '70', capital: 'Kolkata' },
  { name: 'Jharkhand', code: '20', pincodeStart: '81', capital: 'Ranchi' },
  { name: 'Odisha', code: '21', pincodeStart: '75', capital: 'Bhubaneswar' },
  { name: 'Chhattisgarh', code: '22', pincodeStart: '49', capital: 'Raipur' },
  { name: 'Madhya Pradesh', code: '23', pincodeStart: '45', capital: 'Bhopal' },
  { name: 'Gujarat', code: '24', pincodeStart: '38', capital: 'Gandhinagar' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26', pincodeStart: '39', capital: 'Daman' },
  { name: 'Maharashtra', code: '27', pincodeStart: '40', capital: 'Mumbai' },
  { name: 'Karnataka', code: '29', pincodeStart: '56', capital: 'Bengaluru' },
  { name: 'Goa', code: '30', pincodeStart: '40', capital: 'Panaji' },
  { name: 'Lakshadweep', code: '31', pincodeStart: '68', capital: 'Kavaratti' },
  { name: 'Kerala', code: '32', pincodeStart: '69', capital: 'Thiruvananthapuram' },
  { name: 'Tamil Nadu', code: '33', pincodeStart: '60', capital: 'Chennai' },
  { name: 'Puducherry', code: '34', pincodeStart: '60', capital: 'Puducherry' },
  { name: 'Andaman and Nicobar Islands', code: '35', pincodeStart: '74', capital: 'Port Blair' },
  { name: 'Telangana', code: '36', pincodeStart: '50', capital: 'Hyderabad' },
  { name: 'Andhra Pradesh', code: '37', pincodeStart: '52', capital: 'Amaravati' },
  { name: 'Ladakh', code: '38', pincodeStart: '19', capital: 'Leh' },
];

export const CRAFT_DADDY_LOGO_SVG = CRAFT_DADDY_LOGO_URL;

export const INITIAL_USER_PROFILE = {
  companyName: 'Craft Daddy',
  logoUrl: CRAFT_DADDY_LOGO_URL,
  address: {
    street: 'E-167, West Vinod Nagar, I.P.Extension',
    city: 'Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110092',
    country: 'India',
  },
  gstin: '07CCDPK8228H1ZI',
  pan: 'CCDPK8228H',
  bankAccounts: [
    {
      accountName: 'CRAFT DADDY',
      accountNumber: '768501010050325',
      ifscCode: 'UBIN0576859',
      bankName: 'UNION BANK OF INDIA',
      branchName: 'I.P. Extension',
      accountType: 'Current'
    },
  ],
  emailTemplate: "Please find the {type} \"{number}\" for the amount of \"{amount}\"\n\nRegards,\n{companyName}"
};
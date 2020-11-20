/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {PureComponent} from 'react';
import {
  // SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  StatusBar,
  PermissionsAndroid
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import SmsListener from 'react-native-android-sms-listener';

/* @var {String} */
const APP_VERSION = '1.0.2';

/**
 * 
 */
export default class App extends PureComponent
{
  /**
   * 
   * @param {*} props 
   */
  constructor(props) {
    super(props);

    // Init state
    this.state = {
      /** @var {Array} */
      smsArr: []
    };

    //
    this._smsListener = SmsListener.addListener(async _sms => {
      // Parse sms content
      let sms = this._parseSms(_sms);

      // Send data to API
      sms = await this._sendAPI(sms);

      // Change state, trigger re-render
      this.setState(({smsArr}) =>  {
        smsArr = [sms].concat(smsArr);
        return {smsArr};
      });
    });
  }

  /** @var {Object} */
  _smsListener = null;

  componentDidMount = async () => {
    await this._requestPermissions();
  };

  componentWillUnmount = () => {
    this._smsListener.remove();
  };

  _requestPermissions = async () => {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "READ_SMS",
        message: "plan2travel"
      }
    );
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: "RECEIVE_SMS",
        message: "plan2travel"
      }
    );
  };

  /** @var {String} */
  _apiUrl = 'https://plantotravel.vn/api-sms-payment';

  /**
   * @param {*} text 
   */
  handleChangeApiUrl = (text) => {
    this._apiUrl = text;
  };

  /**
   * Parse sms content
   * @param {Object<
   *  originatingAddress: string,
   *  body: string,
   *  timestamp: number
   * >} _sms
   * @return {Object<
   *  originatingAddress: string,
   *  body: string,
   *  timestamp: number,
   *  ...
   * >}
   */
  _parseSms = (_sms) => {
    let pattern = /SD TK ?(\d+) ?([+-])?([\d,.]+)VND ?luc ?(\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})\. ?(SD ?[+-]?[\d,.]+VND\.) ?Ref ?([\d,.]+)\.(.*)/i;
    let m = new String(_sms.body).trim().match(pattern) || [];
    //
    let sms = Object.assign({}, {
      'ID': '',
      'so_tien': ((m[2] || '') == '-' ? -1 : 1) * (m[3] || '').replace(/[,.]/g, ''),
      'thoi_gian': m[4] || '',
      'noi_dung': m[7] || '',
      'so_tk': m[1] || '',
      'ref': m[6] || '',
      'IDs': '',
      // 'so_du': 1 * (m[5] || '').replace(/[,.]/g, ''),
    }, _sms, {
      '_api': '',
    });
    // Remove data parts
    // +++
    if (m[5]) { // so_du
      sms.body = sms.body.replace(m[5], '');
    }
    // +++
    if (sms.noi_dung) {
      m = sms.noi_dung.match(pattern = /PT[TVH][\d]+/ig) || [];
      // T/H khong co prefix PT[TVH]
      if (!m.length) {
        m = sms.noi_dung.match(pattern = /\b\d{4,}\b/ig) || [];
      }
      if (m.length) {
        sms.ID = ('' + m[0]).trim();
        sms.IDs = m.join('; ').trim();
      }
    }
    if (sms.ID === sms.IDs) {
      delete sms['IDs'];
    }
    // +++
    return sms;
  };
  
  /**
   * 
   * @param {*} sms 
   */
  _sendAPI = async (sms) => {
    let _api = '__(not send)__';
    // Validate
    if (sms && (sms.ID || sms.so_tien || sms.ref)) {
      _api = '';
      try {
        // Filter data
        let post = Object.assign({}, sms);
        // +++
        Object.keys(post).forEach((key) => {
          if (key.indexOf('_') === 0) {
            delete post[key];
          }
        });

        // Send data
        let resp = await fetch(this._apiUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(post)
        });
        // +++
        _api = await resp.text();
        _api = `<<status: ${resp.status}>> ${_api}`.trim();
      } catch (error) {
        _api = `Error: ${error.message}.`;
      }
    }
    //
    return Object.assign(sms, {_api});
  };

  render() {
    let {smsArr} = this.state;
    return (
      <>
        <StatusBar barStyle="default" />
        <View style={[styles.apiBar]}>
          <TextInput
            style={[styles.apiBarTxt]}
            onChangeText={this.handleChangeApiUrl}
            defaultValue={this._apiUrl}
          />
        </View>
        <View style={[styles.smsBar]}>
          <Text>
            <Text>(Ver: {APP_VERSION}) / </Text>
            <Text style={[styles.highlight]}>sms(es):</Text> {smsArr.length}.
          </Text>
        </View>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={[styles.scrollView]}
        >
          {smsArr.map((sms, idx) => {
            // Limit?
            if (idx >= 100) {
              return null;
            }
            console.log('sms: ', sms);
            return <View key={`sms-${new Date().getTime()}`} style={[styles.sms]}>
              <Text
                style={[sms.ID ? null : styles.smsTxtNG]}
                selectable={true}
              >
                <Text style={[styles.highlight]}>{1 + idx}.</Text> {JSON.stringify(sms, null, 2)}
              </Text>
            </View>;
          })}
        </ScrollView>
      </>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  apiBar: {
    padding: 1
  },
  apiBarTxt: {
    height: 40,
    borderWidth: 1,
    borderColor: 'silver'
  },
  scrollView: {
    backgroundColor: Colors.lighter,
    borderTopWidth: 1,
    borderTopColor: 'gray'
  },
  smsBar: {
    padding: 12
  },
  sms: {
    margin: 3,
    padding: 6,
    borderWidth: 1,
    borderColor: 'gray'
  },
  smsTxtNG: {
    color: 'red'
  },
  highlight: {
    fontWeight: '700',
  },
});

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {PureComponent} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  PermissionsAndroid
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

// import SmsRetriever from 'react-native-sms-retriever';
import SmsListener from 'react-native-android-sms-listener';

export default class App extends PureComponent
{
  /**
   * 
   * @param {*} props 
   */
  constructor(props) {
    super(props);

    this.state = {
      smsArr: []
    };
  }

  componentDidMount() {
    this._requestReadSmsPermission();
    //
    SmsListener.addListener(sms => {
      this.setState(({smsArr}) =>  {
        smsArr = smsArr.concat(sms);
        return {smsArr};
      });
    });
  }

  _requestReadSmsPermission = async () => {
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
  }

  render() {
    let {smsArr} = this.state;
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <View style={{flex: 1}}>
          <Text>sms(s): {smsArr.length}</Text>
          {smsArr.map((sms, idx) => {
            return <Text key={`sms-${idx}`}>{sms.body}</Text>;
          })}
        </View>
      </>
    );
  }
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

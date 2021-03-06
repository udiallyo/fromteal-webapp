import React, { Component } from 'react'

import { StyledFirebaseAuth } from 'react-firebaseui'
import axios from 'axios'

import firebase from '../../firebase/firebase-config'

import AuthContext from '../auth-context'


const FIRST_SIGN_IN_ENDPOINT = `https://us-central1-${process.env.REACT_APP_FIREBASE_PROJECT_ID}.cloudfunctions.net/firstSignIn`


// TODO configure & create TOS & Privacy links & pages

class FirebaseAuth extends Component {

  static contextType = AuthContext


  // Configure FirebaseUI.
  uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
    signInSuccessUrl: '/',
    // We will display Google as auth provider.
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ]
  }

  storeUserDetails = (user) => {
    console.log("storeUserDetails")
    localStorage.clear()
    localStorage.setItem('user_name', user.name)
    localStorage.setItem('user_email', user.email)
    localStorage.setItem('user_picture', user.picture)
  }

  isFirstSignIn = (user) => {
    return (user.metadata.creationTime == user.metadata.lastSignInTime)
  }

  handleFirstSignIn = (user) => {
    firebase.auth().currentUser.getIdToken(true).then((idToken) => {

      axios.get( FIRST_SIGN_IN_ENDPOINT, {headers: {'me': idToken}} )
          .then( response => {
            console.log("Successfully invoked back-end 1st-sign-in handler")
            console.log(response.data)
            // extract the name of the personal-team created
            // TODO verify
            const personalTeamName = response.data.personalTeamName 
            // TODO redirect to the user's personal team page
          })
    })
  }

  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
        (user) => {
          console.log(`AuthStateChanged - user = ${user}`)
          if (user) {
            console.log(user)
            if (this.isFirstSignIn(user)) {
              this.handleFirstSignIn(user)
            }
            const userModel = {
              name: user.displayName,
              email: user.email,
              picture: user.photoURL
            }
            this.storeUserDetails(userModel)
            this.context.setAuthState(true, userModel)
          } else {
            this.context.setAuthState(false, null)
          }
        }
    );
  }

  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render() {
    return (
      <StyledFirebaseAuth uiConfig={this.uiConfig} firebaseAuth={firebase.auth()}/>
    )
  }
}


export default FirebaseAuth

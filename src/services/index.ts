import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { ORDER_CANCELED } from '~/constants/Status';
import {
  ICategoryFirebaseDoc,
  IProductFirebaseDoc,
  IProduct,
} from '~/@types';

import FirebaseKeys from '~/config/Firebase';

class Firebase {
  constructor() {
    if (!firebase.apps.length) firebase.initializeApp(FirebaseKeys);
  }

  /* Authentication */

  signIn(email: string, password: string) {
    return new Promise((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(({ user }) => {
          resolve({ uid: user?.uid, name: user?.displayName, email: user?.email });
        })
        .catch(() => reject());
    });
  }

  signUp(name: string, email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(({ user }) => {
          user?.updateProfile({ displayName: name })
            .then(() => resolve())
            .catch(() => reject());
        })
        .catch(() => reject());
    });
  }

  getSession() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          return resolve({ uid: user?.uid, name: user?.displayName, email: user?.email });
        }

        resolve(null);
      });
    });
  }

  signOut() {
    return new Promise<void>((resolve) => {
      firebase.auth().signOut()
        .then(() => resolve());
    });
  }

  /* Firestore */

  getCategories() {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('categories').orderBy('order', 'asc').get()
        .then((querySnapshot) => {
          const categories: ICategoryFirebaseDoc[] = [];
          querySnapshot.forEach((doc) => categories.push({ ...doc.data(), id: doc.id }));

          resolve(categories);
        })
        .catch(() => reject());
    });
  }

  getProducts() {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('products').get()
        .then((querySnapshot) => {
          const products: IProductFirebaseDoc[] = [];
          querySnapshot.forEach((doc) => products.push({ ...doc.data(), id: doc.id }));

          resolve(products);
        })
        .catch(() => reject());
    });
  }

  sendOrder(products: IProduct[], accountUid: string) {
    return new Promise<void>((resolve, reject) => {
      firebase.firestore().collection('orders').add({ products, clientUid: accountUid, createdAt: new Date().getTime() })
        .then(() => resolve())
        .catch(() => reject());
    });
  }

  getOrders(accountUid: string) {
    return new Promise<void>((resolve) => {
      firebase.firestore().collection('orders').where('clientUid', '==', accountUid).limit(10).get()
        .then((querySnapshot) => {
          const orders: any = [];
          querySnapshot.forEach((doc) => orders.push({ ...doc.data(), id: doc.id }));

          resolve(orders);
        });
    });
  }

  cancelOrderStatus(orderId: string) {
    return new Promise<void>((resolve) => {
      firebase.firestore().collection('orders').doc(orderId).update({ status: ORDER_CANCELED })
        .then(() => resolve());
    });
  }
}

export default new Firebase();

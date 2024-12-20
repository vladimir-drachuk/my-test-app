import { createContext, FC, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';

import { initializeFirebaseApp } from '@/firebase';
import { BaseComponentProps } from '@/types';
import { useCreateUserMutation, useLazyGetUserQuery } from '@/rest/query';
import { UserAuthModel, UserModel } from '@/rest/model';

type AuthProps = Omit<UserModel, 'id'> & UserAuthModel;
type UserProps = Omit<UserAuthModel, 'password'> & UserModel;

interface AuthContextProps {
  user: UserProps | null;
  signUp(data: AuthProps): Promise<void>;
  logIn(data: UserAuthModel): Promise<void>;
  logOut(): Promise<void>;
}

initializeFirebaseApp();
const auth = getAuth();

const AuthContext = createContext<AuthContextProps>({
  user: null,
  signUp: async () => {},
  logIn: async () => {},
  logOut: async () => {}
});

const { Provider } = AuthContext;

export const AuthProvider: FC<BaseComponentProps> = ({ children }) => {
  const [getUserFromDb] = useLazyGetUserQuery();
  const { mutateAsync: saveUserToDb } = useCreateUserMutation();
  const [user, setUser] = useState<UserProps | null>(null);

  const signUp = async ({ firstName, lastName, email, password }: AuthProps) => {
    if (user) return;

    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

    if (newUser) {
      const id = newUser.uid;

      await saveUserToDb({ id, firstName, lastName });
      setUser({ firstName, lastName, email, id });
    }
  }

  const logIn = async ({ email, password }: UserAuthModel) => {
    if (user) return;

    const { user: loggedUser } = await signInWithEmailAndPassword(auth, email, password);
    const result = await getUserFromDb(loggedUser.uid);

    if (result) {
      const { firstName, lastName } = result;

      setUser({ firstName, lastName, email, id: loggedUser.uid });
    }
  }

  const logOut = async () => {
    await signOut(auth);

    setUser(null);
    console.log('logout');
  }

  useEffect(() => onAuthStateChanged(auth, (authUser) => {
    console.log({ authUser });
  }), []);

  return <Provider value={{ user, signUp, logIn, logOut }}>{children}</Provider>;
};

export const useAuth = () => useContext(AuthContext);
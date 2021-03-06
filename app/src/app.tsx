import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import type { RequestConfig, RunTimeLayoutConfig } from 'umi';
import defaultSettings from '../config/defaultSettings';
// import Loading from './components/Loading/Loading';
import { notification } from 'antd';
import NoFoundPage from './pages/404';
import Header from './components/Header';
import {Link} from "umi";

export const initialStateConfig = {
  // loading: <Loading />,
};

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  loading?: boolean;
}> {
  return {
    settings: defaultSettings,
  };
}

export const request: RequestConfig = {
  errorHandler: (error: any) => {
    const { response } = error;

    if (!response) {
      notification.error({
        description: 'An exception has occurred in your network. Cannot connect to the server',
        message: 'Network exception',
      });
    }
    throw error;
  },
};

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const styles = {
    fontSize: "20px",
    color: "white",
  }
  return {
    disableContentMargin: true,
    menuHeaderRender: () => <Link to="/" style={styles}>Video2Earn</Link>,
    headerTitleRender: () => <Link to="/" style={styles}>Video2Earn</Link>,
    footerRender: () => undefined,
    rightContentRender: () => Header(),
    onPageChange: () => {
      setInitialState({ ...initialState });
    },
    // headerTheme: 'light',
    // headerHeight: 64,
    unAccessible: <NoFoundPage />,
    ...initialState?.settings,
  };
};

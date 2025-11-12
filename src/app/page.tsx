import Main from "./Main";
import enSDkJson from '@teable/common-i18n/src/locales/en/sdk.json';
import zhSDkJson from '@teable/common-i18n/src/locales/zh/sdk.json';
import { EnvProvider } from '@/components/context/EnvProvider';
import { I18nProvider } from '@/components/context/I18nProvider';
import { Metadata } from 'next';
import enCommonJson from '../locales/en.json';
import zhCommonJson from '../locales/zh.json';
import { IPageParams } from '@/components/context/types';

const resources = {
  en: { sdk: enSDkJson, common: enCommonJson },
  zh: { sdk: zhSDkJson, common: zhCommonJson },
};

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: 'Find and Replace',
    description: 'Efficient find and replace tool for Teable tables',
  };
}

export default async function Home(props: { searchParams: Promise<IPageParams> }) {
  const searchParams = await props.searchParams;

  return (
    <main className="h-screen">
      <EnvProvider>
        <I18nProvider
          lang={searchParams.lang}
          resources={resources}
          defaultNS="common"
        >
          <Main theme={searchParams.theme} />
        </I18nProvider>
      </EnvProvider>
    </main>
  );
}

import { Helmet } from 'react-helmet-async';

export const Seo = ({ title, description }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

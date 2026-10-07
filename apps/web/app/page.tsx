import { ReferenceHome } from '../components/reference-home';
import './reference-home.css';

export const metadata={title:'MedCare | Homepage design preview',description:'Reference homepage preview with dummy providers, statistics, reviews and prices.',robots:{index:false,follow:true}};

export default function Home() {
  return <ReferenceHome />;
}

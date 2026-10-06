import {notFound} from 'next/navigation';
import {detail} from '../../../lib/api';
import {ProviderProfile} from '../../../components/provider-profile';
export const dynamic='force-dynamic';
export default async function Profile({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const provider=await detail(slug);
 if(!provider)notFound();
 return <ProviderProfile provider={provider}/>;
}

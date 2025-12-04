import MainLayout from '../components/layouts/MainLayout';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title, description }) => {
    return (
        <MainLayout>
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#752568] to-[#5a1d4f] rounded-full flex items-center justify-center">
                            <Construction className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600 max-w-md">
                        {description || 'Esta sección se implementará próximamente.'}
                    </p>
                    <div className="pt-4">
                        <span className="text-sm text-gray-500">
                            Próximamente disponible en las siguientes fases del proyecto
                        </span>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PlaceholderPage;


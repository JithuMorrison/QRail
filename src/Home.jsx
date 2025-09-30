import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Warehouse, Wrench, ClipboardCheck, ArrowRight, LogIn, UserPlus } from 'lucide-react';

const Home = ({ user }) => {
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-5 py-10">
        <div className="max-w-6xl mx-auto text-center py-20 px-5">
          <div className="mb-8 inline-block p-4 bg-white rounded-full shadow-lg">
            <Package className="w-16 h-16 text-orange-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Welcome Back
          </h1>
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md mb-10">
            <span className="text-lg text-gray-600">Logged in as</span>
            <span className="px-4 py-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-full font-semibold text-lg">
              {user.role}
            </span>
          </div>
          <div className="mt-8">
            <Link 
              to={`/${user.role}`} 
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold text-lg shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-600/40 hover:from-orange-700 hover:to-orange-800"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roles = [
    { 
      role: 'Vendor', 
      desc: 'Create material batches and generate unique QR codes for tracking',
      icon: Package,
      gradient: 'from-orange-500 to-orange-600'
    },
    { 
      role: 'Depot Staff', 
      desc: 'Scan incoming materials and manage warehouse inventory',
      icon: Warehouse,
      gradient: 'from-orange-600 to-orange-700'
    },
    { 
      role: 'Installation Crew', 
      desc: 'Scan materials on-site and record installation details',
      icon: Wrench,
      gradient: 'from-amber-600 to-orange-600'
    },
    { 
      role: 'Inspector', 
      desc: 'Verify installations and ensure quality compliance',
      icon: ClipboardCheck,
      gradient: 'from-orange-700 to-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-5 py-12">
      <div className="max-w-7xl mx-auto px-5">
        {/* Hero Section */}
        <div className="text-center py-16 mb-12">
          <div className="mb-8 inline-block p-5 bg-white rounded-3xl shadow-xl">
            <Package className="w-20 h-20 text-orange-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            QR Material Tracking
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
            End-to-end supply chain visibility from vendor to installation with intelligent QR technology
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {roles.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-amber-100"
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-gray-800 mb-3 text-xl font-bold">
                  {item.role}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
            Why Choose Our System?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 mb-4">
                <Package className="w-10 h-10 text-orange-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Real-Time Tracking</h4>
              <p className="text-gray-600 text-sm">Monitor every material's journey from creation to installation</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 mb-4">
                <ClipboardCheck className="w-10 h-10 text-orange-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Quality Assurance</h4>
              <p className="text-gray-600 text-sm">Built-in inspection workflows ensure compliance standards</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 mb-4">
                <Warehouse className="w-10 h-10 text-orange-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Inventory Management</h4>
              <p className="text-gray-600 text-sm">Automated stock tracking with instant visibility across locations</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Join our platform and transform your material tracking workflow
          </p>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold text-lg shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-600/40 hover:from-orange-700 hover:to-orange-800"
            >
              <LogIn className="w-5 h-5" />
              Login
            </Link>
            <Link 
              to="/register" 
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-orange-600 font-semibold text-lg border-2 border-orange-600 shadow-lg transition-all hover:-translate-y-1 hover:bg-orange-600 hover:text-white hover:shadow-xl"
            >
              <UserPlus className="w-5 h-5" />
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
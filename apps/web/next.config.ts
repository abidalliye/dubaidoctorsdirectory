import type { NextConfig } from "next";
const config: NextConfig = {
  ...(process.env.NETLIFY ? {} : { output: "standalone" }),
  async rewrites() {
    return process.env.NETLIFY
      ? []
      : [
          {
            source: "/v1/:path*",
            destination: `${process.env.API_URL || "http://127.0.0.1:4000"}/v1/:path*`,
          },
        ];
  },
  async redirects() {
    return [
      ...Object.entries({
        '/dashboard-doctor.html': '/dashboard/doctor',
        '/dashboard-patient.html': '/dashboard/patient',
        '/dashboard-hospital.html': '/dashboard/hospital',
        '/submit-business.html': '/listings',
        '/for-doctors.html': '/list-your-business',
        '/ivf_fertility_directory_landing_page.html': '/',
        '/fertifind_dubai_directory_search_page.html': '/directory',
        '/fertifind_doctor_profile_page.html': '/doctors',
        '/fertifind_hospital_profile_page.html': '/hospitals',
        '/fertifind_labs_profile_page.html': '/laboratories',
        '/ivf-fertility-doctors-in-dubai-healthcare-city.html': '/directory?area=Dubai%20Healthcare%20City',
        '/ivf-clinics-in-jumeirah-dubai.html': '/clinics?area=Jumeirah',
        '/fertility-treatment-cost-dubai.html': '/pages/fertility-treatment-cost-dubai',
        '/location.html': '/locations',
      }).map(([source,destination])=>({source,destination,permanent:true})),
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/auth.html", destination: "/auth", permanent: true },
      {
        source: "/admin.html",
        destination: "/dashboard/admin",
        permanent: true,
      },
      {
        source: "/doctor-dashboard.html",
        destination: "/dashboard/doctor",
        permanent: true,
      },
      {
        source: "/patient-dashboard.html",
        destination: "/dashboard/patient",
        permanent: true,
      },
    ];
  },
};
export default config;

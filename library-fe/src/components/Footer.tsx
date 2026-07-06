// src/components/Footer.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LogoUmc from "@/assets/logo_umc.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-white py-6 md:py-8 px-4 sm:px-6 md:px-12">
      <div className="max-w-6xl mx-auto block lg:flex lg:justify-between gap-6 lg:gap-8 space-y-6 lg:space-y-0">
        {/* Kolom 1: Logo & Media Sosial */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={LogoUmc} alt="UMC Logo" />
              <AvatarFallback>UMC</AvatarFallback>
            </Avatar>
          </div>

          {/* Ikon Media Sosial — SVG Inline (tanpa FontAwesome, tanpa Lucide brand icons) */}
          <div className="block">
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Universitas Muhammadiyah Cirebon
              </h3>
              <p className="text-xs sm:text-sm opacity-80">
                Waqaf, Islami, Mandiri & Profesional
              </p>
            </div>

            <div className="flex space-x-4 mt-4">
              {/* Facebook */}
              <a
                href="https://facebook.com/umc"
                className="hover:text-blue-300 transition-colors"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-facebook-icon lucide-facebook"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/umc"
                className="hover:text-pink-300 transition-colors"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-instagram-icon lucide-instagram"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="https://twitter.com/umc"
                className="hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="w-5 h-5"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L3.954 22.25H.646l7.712-8.803L.046 2.25h6.842l4.952 6.575L18.244 2.25z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/umc"
                className="hover:text-red-300 transition-colors"
                aria-label="YouTube"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-youtube-icon lucide-youtube"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/6281234567890"
                className="hover:text-green-300 transition-colors"
                aria-label="WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.644-.506-.158-.007-.347-.007-.52-.007-.173 0-.446.074-.669.322-.224.248-.867.867-.867 2.058 0 2.005 1.455 3.926 1.653 4.174.198.248 2.789 4.237 6.766 5.888.994.41 1.793.62 2.44.66.645.04 1.24-.02 1.737-.298.497-.272.867-.746.867-.746l.149-.124c.149-.124.298-.298.446-.472.149-.174.298-.298.298-.497 0-.199-.149-.372-.298-.52z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Kolom 2: Lembaga dan Pusat */}
        <div className="max-w-68">
          <h4 className="font-bold text-sm sm:text-base mb-4">
            Lembaga dan Pusat
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm opacity-90">
            <li>
              <a href="#">Lembaga Penjamin Mutu (LPM) UMC</a>
            </li>
            <li>Lembaga Pengembangan Kurikulum dan Pembelajaran (LPKP)</li>
            <li>Lembaga Penelitian dan Pengabdian Masyarakat (LPPM)</li>
            <li>Kantor Urusan Kerjasama dan Internasional (KUI)</li>
            <li>Lembaga Pengembangan dan Kajian Al-Islam (LPAIK)</li>
            <li>Career Development Center (CDC)</li>
            <li>Lembaga Pengembangan Unit Usaha (LPUU)</li>
            <li>Alumni UMC</li>
            <li>Kemahasiswaan UMC</li>
          </ul>
        </div>

        {/* Kolom 3: Hubungi Kami */}
        <div>
          <h4 className="font-bold text-sm sm:text-base mb-4">Hubungi Kami</h4>
          <div className="space-y-3 text-xs sm:text-sm opacity-90">
            <p>
              <strong>Kampus 1:</strong>
              <br />
              Jl. Tuparev No. 70 Cirebon
              <br />
              Telp. (0231) 209608, 209617
            </p>
            <p>
              <strong>Kampus 2:</strong>
              <br />
              Kampus Utama Jl. Watubelah No. 40 – Sumber
              <br />
              Telp. (0231) 209608, 209617
            </p>
            <p>
              <strong>Kampus 3:</strong>
              <br />
              Jl. Watubelah – Sumber
              <br />
              Telp. (0231) 209608, 209617
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-primary mt-8 pt-4 text-center text-[10px] sm:text-[12px] lg:text-sm opacity-80">
        Copyright © {new Date().getFullYear()} Universitas Muhammadiyah Cirebon
      </div>
    </footer>
  );
};

export default Footer;

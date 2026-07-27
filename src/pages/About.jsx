import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md my-8 border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        About This App
      </h2>
      
      <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
        
        {/* General About / License Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            License
          </h3>
          <p>
            This application is open-source software released under the <strong>MIT License</strong>. 
            You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
            copies of the software, provided that the original copyright notice and this permission 
            notice are included in all copies or substantial portions of the software.
          </p>
        </section>

        {/* Disclaimer Section (Directly from MIT boilerplate) */}
        <section>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Disclaimer of Liability
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-mono text-xs md:text-sm uppercase text-gray-500 dark:text-gray-400 tracking-tight">
              The software is provided "as is", without warranty of any kind, express or implied, 
              including but not limited to the warranties of merchantability, fitness for a particular 
              purpose and noninfringement. In no event shall the authors or copyright holders be 
              liable for any claim, damages or other liability, whether in an action of contract, 
              tort or otherwise, arising from, out of or in connection with the software or the use 
              or other dealings in the software.
            </p>
          </div>
        </section>
        
        {/* Optional: Credit third-party tools like D3 */}
        <section>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Third-Party Acknowledgements
          </h3>
          <p>
            This project is built using fantastic open-source libraries from the community, including{' '}
            <a 
              href="https://d3js.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              D3.js
            </a> (ISC License).
          </p>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;
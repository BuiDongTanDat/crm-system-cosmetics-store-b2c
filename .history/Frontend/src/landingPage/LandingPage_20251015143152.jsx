import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* SVG Icons */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <defs>
          <symbol xmlns="http://www.w3.org/2000/svg" id="instagram" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor"
              d="M11 3.5h1M4.5.5h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Zm3 10a3 3 0 1 1 0-6a3 3 0 0 1 0 6Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="facebook" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor"
              d="M7.5 14.5a7 7 0 1 1 0-14a7 7 0 0 1 0 14Zm0 0v-8a2 2 0 0 1 2-2h.5m-5 4h5" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="search" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="heart" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M20.16 4.61A6.27 6.27 0 0 0 12 4a6.27 6.27 0 0 0-8.16 9.48l7.45 7.45a1 1 0 0 0 1.42 0l7.45-7.45a6.27 6.27 0 0 0 0-8.87Zm-1.41 7.46L12 18.81l-6.75-6.74a4.28 4.28 0 0 1 3-7.3a4.25 4.25 0 0 1 3 1.25a1 1 0 0 0 1.42 0a4.27 4.27 0 0 1 6 6.05Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="cart" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" />
          </symbol>
        </defs>
      </svg>

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg bg-light text-uppercase fs-6 p-3 border-bottom align-items-center">
        <div className="container-fluid">
          <div className="row justify-content-between align-items-center w-100">
            <div className="col-auto">
              <a className="navbar-brand text-dark" href="#home">
                <div className="brand-logo">KAIRA</div>
              </a>
            </div>

            <div className="col-auto">
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav justify-content-end flex-grow-1 gap-1 gap-md-5 pe-3">
                  <li className="nav-item">
                    <a className="nav-link active" href="#home">Home</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#shop">Shop</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#blog">Blog</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#contact">Contact</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-3 col-lg-auto">
              <ul className="list-unstyled d-flex m-0">
                <li className="d-none d-lg-block">
                  <a href="#wishlist" className="text-uppercase mx-3">Wishlist (0)</a>
                </li>
                <li className="d-none d-lg-block">
                  <a href="#cart" className="text-uppercase mx-3">Cart (0)</a>
                </li>
                <li>
                  <a href="#search" className="mx-2">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <use xlinkHref="#search"></use>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="billboard" className="bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <h1 className="section-title text-center mt-4">New Collections</h1>
            <div className="col-md-6 text-center">
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe voluptas ut dolorum consequuntur, adipisci
                repellat! Eveniet commodi voluptatem voluptate, eum minima, in suscipit explicabo voluptatibus harum,
                quibusdam ex repellat eaque!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-5">
        <div className="container">
          <div className="row">
            <div className="col-md-3 text-center">
              <div className="py-5">
                <div className="feature-icon">📅</div>
                <h4 className="element-title text-capitalize my-3">Book An Appointment</h4>
                <p>At imperdiet dui accumsan sit amet nulla risus est ultricies quis.</p>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="py-5">
                <div className="feature-icon">🛍️</div>
                <h4 className="element-title text-capitalize my-3">Pick up in store</h4>
                <p>At imperdiet dui accumsan sit amet nulla risus est ultricies quis.</p>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="py-5">
                <div className="feature-icon">🎁</div>
                <h4 className="element-title text-capitalize my-3">Special packaging</h4>
                <p>At imperdiet dui accumsan sit amet nulla risus est ultricies quis.</p>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="py-5">
                <div className="feature-icon">🔄</div>
                <h4 className="element-title text-capitalize my-3">free global returns</h4>
                <p>At imperdiet dui accumsan sit amet nulla risus est ultricies quis.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories overflow-hidden py-5">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="cat-item image-zoom-effect">
                <div className="image-holder">
                  <img src="/images/cat-item1.jpg" alt="categories" className="product-image img-fluid" />
                </div>
                <div className="category-content">
                  <div className="product-button">
                    <button className="btn btn-primary text-uppercase">Shop for men</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="cat-item image-zoom-effect">
                <div className="image-holder">
                  <img src="/images/cat-item2.jpg" alt="categories" className="product-image img-fluid" />
                </div>
                <div className="category-content">
                  <div className="product-button">
                    <button className="btn btn-primary text-uppercase">Shop for women</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="cat-item image-zoom-effect">
                <div className="image-holder">
                  <img src="/images/cat-item3.jpg" alt="categories" className="product-image img-fluid" />
                </div>
                <div className="category-content">
                  <div className="product-button">
                    <button className="btn btn-primary text-uppercase">Shop accessories</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 py-5 my-5">
              <div className="subscribe-header text-center pb-3">
                <h3 className="section-title text-uppercase">Sign Up for our newsletter</h3>
              </div>
              <form className="d-flex flex-wrap gap-2">
                <input type="email" name="email" placeholder="Your Email Address" className="form-control form-control-lg" />
                <button className="btn btn-dark btn-lg text-uppercase w-100">Sign Up</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="mt-5">
        <div className="container">
          <div className="row d-flex flex-wrap justify-content-between py-5">
            <div className="col-md-3 col-sm-6">
              <div className="footer-menu">
                <div className="footer-intro mb-4">
                  <div className="brand-logo">KAIRA</div>
                </div>
                <p>Gravida massa volutpat aenean odio. Amet, turpis erat nullam fringilla elementum diam in.</p>
                <div className="social-links">
                  <ul className="list-unstyled d-flex flex-wrap gap-3">
                    <li>
                      <a href="#" className="text-secondary">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <use xlinkHref="#facebook"></use>
                        </svg>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-secondary">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <use xlinkHref="#instagram"></use>
                        </svg>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="footer-menu">
                <h5 className="widget-title text-uppercase mb-4">Quick Links</h5>
                <ul className="menu-list list-unstyled text-uppercase">
                  <li className="menu-item">
                    <a href="#home">Home</a>
                  </li>
                  <li className="menu-item">
                    <a href="#about">About</a>
                  </li>
                  <li className="menu-item">
                    <a href="#services">Services</a>
                  </li>
                  <li className="menu-item">
                    <a href="#contact">Contact</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="footer-menu">
                <h5 className="widget-title text-uppercase mb-4">Contact Us</h5>
                <p>Do you have any questions? <a href="mailto:contact@kaira.com">contact@kaira.com</a></p>
                <p>Need support? <a href="tel:+1234567890">+1 234 567 890</a></p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-top py-4">
          <div className="container">
            <div className="row">
              <div className="col-12 text-center">
                <p>© 2024 Kaira CRM. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

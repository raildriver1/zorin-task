'use client';

import { useState } from 'react';
import { ChevronDown, Check, Bell, Clock, TrendingUp, Send, Activity, Award } from 'lucide-react';

export default function MemberDemoPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'bloggers'>('users');

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="member-header">
        <div className="member-container member-header-content">
          <a href="/" className="member-logo">
            <span>ZORIN | <span className="member-text-gradient">Member</span></span>
          </a>
          <nav className="member-nav">
            <ul>
              <li><a href="#benefits">Преимущества</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#cta">Контакты</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="member-hero member-section-gap">
        <div className="member-blur-bg" style={{ top: '-10%', left: '-10%' }}></div>
        <div className="member-blur-bg" style={{ bottom: 0, right: '-10%' }}></div>
        <div className="member-container">
          <div className="member-hero-content">
            <div className="member-hero-text">
              <h1>
                <span className="member-text-gradient">Member</span> – поддержка авторов контента
              </h1>
              <p>
                Инновационный сервис для поддержки авторов контента с подписочной системой, сборами средств и виртуальными подарками
              </p>
              <div className="flex gap-4 flex-wrap">
                <a href="#" className="member-btn">Начать сейчас</a>
                <a href="#benefits" className="member-btn member-btn-outline">Узнать больше</a>
              </div>
            </div>
            <div className="member-hero-image member-floating">
              <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Activity className="w-32 h-32 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="member-section-gap" id="benefits">
        <div className="member-container">
          <div className="member-section-title">
            <h2>Преимущества для <span className="member-text-gradient">пользователей</span></h2>
            <p>Member предлагает уникальные возможности для тех, кто хочет поддержать любимых авторов</p>
          </div>

          <div className="member-benefits-grid">
            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <Bell />
              </div>
              <h3>Автоматический доступ</h3>
              <p>Получайте мгновенный доступ к эксклюзивному контенту сразу после оформления подписки.</p>
            </div>

            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <Clock />
              </div>
              <h3>Управление подписками</h3>
              <p>Автоматическое продление подписок, возможность предварительного продления или отмены.</p>
            </div>

            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <Award />
              </div>
              <h3>Розыгрыши и призы</h3>
              <p>Регулярные розыгрыши подписок, эксклюзивного контента и других ценных призов.</p>
            </div>

            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <TrendingUp />
              </div>
              <h3>Доступ к контенту</h3>
              <p>Получайте доступ к эксклюзивному контенту ваших любимых авторов.</p>
            </div>

            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <Send />
              </div>
              <h3>Интеграция с Telegram</h3>
              <p>Доступ ко всему контенту прямо в Telegram без необходимости выходить из мессенджера.</p>
            </div>

            <div className="member-benefit-card">
              <div className="member-benefit-icon">
                <Check />
              </div>
              <h3>Простая регистрация</h3>
              <p>Забудьте о нудной регистрации — доступ через вашу учетную запись Telegram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="member-section-gap bg-gray-50 dark:bg-gray-900" id="faq">
        <div className="member-container">
          <div className="member-section-title">
            <h2>Часто задаваемые <span className="member-text-gradient">вопросы</span></h2>
            <p>Ответы на наиболее распространенные вопросы о сервисе Member</p>
          </div>

          <div className="member-tabs">
            <button
              className={`member-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Для пользователей
            </button>
            <button
              className={`member-tab-btn ${activeTab === 'bloggers' ? 'active' : ''}`}
              onClick={() => setActiveTab('bloggers')}
            >
              Для блогеров
            </button>
          </div>

          <div className="member-faq-list">
            {activeTab === 'users' && (
              <>
                <div className={`member-faq-item ${activeFaq === 0 ? 'active' : ''}`}>
                  <div className="member-faq-question" onClick={() => toggleFaq(0)}>
                    <h3>Как оформить подписку на автора?</h3>
                    <ChevronDown />
                  </div>
                  <div className="member-faq-answer">
                    <p>
                      Для оформления подписки необходимо авторизоваться через Telegram, выбрать интересующего автора,
                      уровень подписки и произвести оплату. После успешной оплаты вы мгновенно получите доступ к эксклюзивному контенту.
                    </p>
                  </div>
                </div>

                <div className={`member-faq-item ${activeFaq === 1 ? 'active' : ''}`}>
                  <div className="member-faq-question" onClick={() => toggleFaq(1)}>
                    <h3>Как отменить автоматическое продление подписки?</h3>
                    <ChevronDown />
                  </div>
                  <div className="member-faq-answer">
                    <p>
                      Отменить автоматическое продление очень просто. Войдите в личный кабинет или используйте соответствующую
                      команду в Telegram-боте, перейдите в раздел "Мои подписки", выберите нужную подписку и нажмите кнопку
                      "Отменить автоматическое продление".
                    </p>
                  </div>
                </div>

                <div className={`member-faq-item ${activeFaq === 2 ? 'active' : ''}`}>
                  <div className="member-faq-question" onClick={() => toggleFaq(2)}>
                    <h3>Какие способы оплаты доступны?</h3>
                    <ChevronDown />
                  </div>
                  <div className="member-faq-answer">
                    <p>
                      Member поддерживает различные способы оплаты: банковские карты, СБП (Система быстрых платежей)
                      и оплата с баланса аккаунта экосистемы. Все платежи защищены современными протоколами шифрования.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'bloggers' && (
              <>
                <div className={`member-faq-item ${activeFaq === 3 ? 'active' : ''}`}>
                  <div className="member-faq-question" onClick={() => toggleFaq(3)}>
                    <h3>Как стать автором в Member?</h3>
                    <ChevronDown />
                  </div>
                  <div className="member-faq-answer">
                    <p>
                      Чтобы стать автором, необходимо оставить заявку через Telegram. После согласования всех условий
                      мы подберем для вас оптимальное предложение и предоставим доступ к личному кабинету Автора.
                    </p>
                  </div>
                </div>

                <div className={`member-faq-item ${activeFaq === 4 ? 'active' : ''}`}>
                  <div className="member-faq-question" onClick={() => toggleFaq(4)}>
                    <h3>Какая комиссия взимается с авторов?</h3>
                    <ChevronDown />
                  </div>
                  <div className="member-faq-answer">
                    <p>
                      Базовая комиссия на платформе составляет 10%. Для авторов с большим количеством подписчиков
                      или высоким оборотом комиссия может быть снижена до 6%. Никаких дополнительных скрытых комиссий не предусмотрено.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="member-cta member-section-gap" id="cta">
        <div className="member-cta-decoration"></div>
        <div className="member-container" style={{ position: 'relative', zIndex: 2 }}>
          <h2>Присоединяйтесь к Member</h2>
          <p>Поддержите ваших любимых авторов и получите доступ к эксклюзивному контенту прямо в Telegram</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#" className="member-btn member-btn-light">Войти через Telegram</a>
            <a href="#benefits" className="member-btn member-btn-outline-light">Узнать больше</a>
          </div>
          <div className="member-cta-features">
            <div className="member-cta-feature">
              <Check />
              <span>Быстрая авторизация через Telegram</span>
            </div>
            <div className="member-cta-feature">
              <Check />
              <span>Безопасные платежи</span>
            </div>
            <div className="member-cta-feature">
              <Check />
              <span>Мгновенный доступ к контенту</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

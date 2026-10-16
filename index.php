<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <meta name="theme-color" content="#f7f5f0">
    <meta name="description" content="Peça seus favoritos online e receba em casa.">
    <title>Cardápio online</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="site-header">
        <a class="brand" href="#" aria-label="Início">
            <span class="brand-mark" aria-hidden="true">b</span>
            <span id="brand-name">Brasa &amp; Pão</span>
        </a>
        <div class="header-meta">
            <span class="status-dot"></span>
            <span id="store-status">Carregando cardápio...</span>
        </div>
        <button class="header-cart" id="header-cart" type="button" aria-label="Ver sacola">
            <span aria-hidden="true">♧</span>
            <span>Sacola</span>
            <span class="cart-count" id="header-cart-count">0</span>
        </button>
    </header>

    <main class="page-shell">
        <section class="hero" aria-labelledby="hero-title">
            <div class="hero-content">
                <span class="eyebrow"><span class="eyebrow-dot"></span> FEITO NA HORA, DO SEU JEITO</span>
                <h1 id="hero-title">Seu próximo<br>favorito está <span>aqui.</span></h1>
                <p>Ingredientes de verdade, sabor de sobra.<br>Escolha o seu e deixe o resto com a gente.</p>
                <div class="hero-details">
                    <span><span aria-hidden="true">◷</span> <span id="delivery-time">30–45 min</span></span>
                    <span class="detail-divider"></span>
                    <span><span aria-hidden="true">⌖</span> Entrega e retirada</span>
                </div>
            </div>
            <div class="hero-image" role="img" aria-label="Hambúrguer artesanal com queijo, alface e tomate"></div>
            <div class="hero-note"><span>✳</span><span>Preparado com<br>carinho para você</span></div>
        </section>
        <section class="order-confirmation" id="order-confirmation" aria-live="polite" hidden></section>

        <div class="shop-layout">
            <section class="menu-section" aria-labelledby="menu-title">
                <div class="section-heading">
                    <div>
                        <span class="section-kicker">ESCOLHA COM CALMA</span>
                        <h2 id="menu-title">Nosso cardápio</h2>
                    </div>
                    <label class="search-field">
                        <span aria-hidden="true">⌕</span>
                        <input id="product-search" type="search" placeholder="Buscar no cardápio..." aria-label="Buscar produto">
                    </label>
                </div>

                <nav class="category-list" id="category-list" aria-label="Categorias do cardápio"></nav>
                <div class="menu-grid" id="product-list" aria-live="polite">
                    <div class="loading-state">Carregando nosso cardápio...</div>
                </div>
            </section>

            <aside class="cart-panel is-collapsed" id="cart-panel" aria-labelledby="cart-title">
                <div class="cart-heading">
                    <div><span class="section-kicker">SUA ESCOLHA</span><h2 id="cart-title">Sua sacola <span id="cart-item-count"></span></h2></div>
                    <button class="cart-collapse" id="cart-collapse" type="button" aria-label="Recolher sacola">⌄</button>
                </div>
                <div class="cart-body">
                    <div class="cart-items" id="cart-items"></div>
                    <div class="cart-empty" id="cart-empty">
                        <span class="empty-bag" aria-hidden="true">♧</span>
                        <strong>Sua sacola está vazia</strong>
                        <p>Escolha algo gostoso para começar.</p>
                    </div>
                    <div class="cart-summary" id="cart-summary" hidden>
                        <div class="delivery-hint" id="delivery-hint">A taxa de entrega aparece na finalização.</div>
                        <div class="summary-row"><span>Subtotal</span><strong id="cart-subtotal">R$ 0,00</strong></div>
                        <div class="summary-row"><span>Entrega</span><strong id="cart-delivery">Calculada no checkout</strong></div>
                        <div class="summary-row total-row"><span>Total</span><strong id="cart-total">R$ 0,00</strong></div>
                        <button class="checkout-button" id="checkout-button" type="button">Continuar para entrega <span aria-hidden="true">→</span></button>
                        <p class="secure-note"><span aria-hidden="true">✓</span> Você confirma o pedido pelo WhatsApp</p>
                    </div>
                </div>
            </aside>
        </div>
        <footer class="site-footer"><span>Feito com carinho, do primeiro clique à última mordida.</span><span>Pagamento online ou direto com a loja <b>✳</b></span><a href="admin/">Acesso administrativo ↗</a></footer>
    </main>

    <div class="modal-backdrop product-modal-backdrop" id="product-modal" hidden>
        <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <button class="modal-close" id="product-modal-close" type="button" aria-label="Fechar">×</button>
            <img class="product-modal-image" id="product-modal-image" alt="">
            <div class="product-modal-content">
                <span class="section-kicker">PERSONALIZE SEU PEDIDO</span>
                <h2 id="product-modal-title"></h2>
                <p class="product-modal-description" id="product-modal-description"></p>
                <strong class="product-modal-price" id="product-modal-price"></strong>
                <label class="field-label product-note-label" for="product-note">Observações <span>(opcional)</span>
                    <textarea id="product-note" rows="3" maxlength="300" placeholder="Ex.: sem cebola, ponto da carne..."></textarea>
                </label>
                <div class="product-modal-footer">
                    <div class="product-quantity" aria-label="Quantidade">
                        <button class="quantity-button" id="product-quantity-decrease" type="button" aria-label="Diminuir quantidade">−</button>
                        <output id="product-quantity" aria-live="polite">1</output>
                        <button class="quantity-button" id="product-quantity-increase" type="button" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button class="checkout-button product-add-button" id="product-add-button" type="button">
                        Adicionar <span id="product-add-total">R$ 0,00</span>
                    </button>
                </div>
            </div>
        </section>
    </div>

    <div class="modal-backdrop" id="checkout-modal" hidden>
        <section class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <button class="modal-close" id="modal-close" type="button" aria-label="Fechar">×</button>
            <span class="section-kicker">SÓ MAIS UM PASSO</span>
            <h2 id="checkout-title">Onde entregamos?</h2>
            <p class="modal-copy">Preencha seus dados para enviar o pedido direto para a loja.</p>
            <form id="checkout-form">
                <label class="field-label">Seu nome<input name="customer_name" required maxlength="100" autocomplete="name" placeholder="Como podemos te chamar?"></label>
                <label class="field-label">Seu WhatsApp<input name="customer_phone" required type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="(11) 99999-9999"></label>
                <div id="online-customer-fields" hidden>
                    <label class="field-label">E-mail<input name="customer_email" type="email" maxlength="254" autocomplete="email" placeholder="voce@exemplo.com"></label>
                    <label class="field-label">CPF<input name="customer_cpf" inputmode="numeric" maxlength="20" autocomplete="off" placeholder="Somente para processar o pagamento"></label>
                </div>
                <fieldset class="choice-field">
                    <legend>Como prefere receber?</legend>
                    <label class="choice-option"><input type="radio" name="fulfillment" value="delivery" checked><span>🚲&nbsp; Entrega</span></label>
                    <label class="choice-option"><input type="radio" name="fulfillment" value="pickup"><span>🛍️&nbsp; Retirar no local</span></label>
                </fieldset>
                <div id="address-fields">
                    <label class="field-label">Endereço<input name="address" required maxlength="180" autocomplete="street-address" placeholder="Rua e número"></label>
                    <div class="field-row">
                        <label class="field-label">Complemento <span>(opcional)</span><input name="complement" maxlength="100" placeholder="Apto, bloco, referência"></label>
                        <label class="field-label">Bairro<input name="neighborhood" required maxlength="100" placeholder="Seu bairro"></label>
                    </div>
                </div>
                <fieldset class="payment-group">
                    <legend><span aria-hidden="true">↗</span> Pagar online</legend>
                    <div class="payment-options" id="online-payment-options">
                        <label class="payment-option"><input type="radio" name="payment_method" value="pix_online" required disabled><span><span class="payment-option-icon" aria-hidden="true">▯</span> Pix</span></label>
                        <label class="payment-option"><input type="radio" name="payment_method" value="credit_card_online" required disabled><span><span class="payment-option-icon" aria-hidden="true">▱</span> Cartão de crédito (em breve)</span></label>
                    </div>
                    <p class="payment-unavailable" id="online-payment-unavailable" hidden>Pagamento online indisponível no momento.</p>
                </fieldset>
                <fieldset class="payment-group">
                    <legend><span aria-hidden="true">⌂</span> Pagar na entrega ou retirada</legend>
                    <div class="payment-options">
                        <label class="payment-option"><input type="radio" name="payment_method" value="cash" required><span><span class="payment-option-icon" aria-hidden="true">▣</span> Dinheiro</span></label>
                        <label class="payment-option"><input type="radio" name="payment_method" value="credit_card" required><span><span class="payment-option-icon" aria-hidden="true">▱</span> Cartão de crédito</span></label>
                        <label class="payment-option"><input type="radio" name="payment_method" value="debit_card" required><span><span class="payment-option-icon" aria-hidden="true">▱</span> Cartão de débito</span></label>
                    </div>
                </fieldset>
                <label class="field-label" id="change-field" hidden>Precisa de troco para quanto?<input name="cash_change" inputmode="decimal" maxlength="12" placeholder="Ex.: 100,00"></label>
                <label class="field-label">Observações <span>(opcional)</span><textarea name="notes" rows="2" maxlength="500" placeholder="Algum detalhe para deixar tudo perfeito?"></textarea></label>
                <div class="checkout-total"><span>Total do pedido</span><strong id="checkout-total">R$ 0,00</strong></div>
                <p class="form-error" id="form-error" role="alert" hidden></p>
                <button class="checkout-button submit-button" type="submit"><span>Enviar pedido pelo WhatsApp</span><span aria-hidden="true">→</span></button>
                <p class="secure-note" id="checkout-payment-note"><span aria-hidden="true">✓</span> Seu pedido só será confirmado após o envio pelo WhatsApp.</p>
            </form>
        </section>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <script src="qrcode-generator.min.js" defer></script>
    <script src="pix-qr.js" defer></script>
    <script src="app.js" defer></script>
</body>
</html>

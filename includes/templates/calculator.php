<div class="atera-compact-calculator" data-config-endpoint="<?php echo esc_url( $config_endpoint ); ?>" data-currency-prefix="<?php echo esc_attr( $currency_prefix ); ?>">
    <div class="atera-compact-calculator__layout">
        <div class="atera-compact-calculator__column atera-compact-calculator__column--intro">
            <h2 class="atera-compact-calculator__title"><?php echo wp_kses_post( $title ); ?></h2>
        </div>
        <div class="atera-compact-calculator__column atera-compact-calculator__column--panel">
            <div class="atera-compact-calculator__panel" data-calculator-panel>
                <p class="atera-compact-calculator__loading"><?php esc_html_e( 'Loading calculator…', 'atera' ); ?></p>
            </div>
        </div>
        <div class="atera-compact-calculator__column atera-compact-calculator__column--summary">
            <div class="atera-compact-calculator__summary-card">
                <div class="atera-compact-calculator__summary-kicker"><?php echo esc_html( $summary_kicker ); ?></div>
                <div class="atera-compact-calculator__summary-total" data-display-savings><?php echo esc_html( $currency_prefix . '0' ); ?></div>
                <p class="atera-compact-calculator__summary-subtext"><?php echo esc_html( $summary_subtext ); ?></p>
                <a href="<?php echo esc_url( $summary_cta_href ); ?>" class="atera-compact-calculator__summary-cta"><?php echo esc_html( $summary_cta ); ?></a>
                <div class="atera-compact-calculator__summary-breakdown">
                    <div class="atera-compact-calculator__summary-breakdown-header"><?php echo esc_html( $summary_breakdown_header ); ?></div>
                    <div class="atera-compact-calculator__summary-breakdown-row">
                        <span><?php echo esc_html( $label_atera ); ?></span>
                        <span data-display-atera-cost><?php echo esc_html( $currency_prefix . '0' ); ?></span>
                    </div>
                    <div class="atera-compact-calculator__summary-breakdown-row">
                        <span><?php echo esc_html( $label_current ); ?></span>
                        <span data-display-current-cost><?php echo esc_html( $currency_prefix . '0' ); ?></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <p class="atera-compact-calculator__note"><?php echo esc_html( $note_text ); ?></p>
</div>

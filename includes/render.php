<?php
/**
 * Front-end rendering for the Atera Compact Calculator block.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Render callback for the block on the front end.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function atera_compact_calculator_render_block( $attributes ) {
    $title = isset( $attributes['title'] ) ? $attributes['title'] : __( 'Calculate how much you save with <br>Atera', 'atera' );

    ob_start();
    ?>
    <div class="atera-compact-calculator" data-config-endpoint="/atera/v1/calculator-config">
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
                    <div class="atera-compact-calculator__summary-kicker"><?php esc_html_e( 'You save', 'atera' ); ?></div>
                    <div class="atera-compact-calculator__summary-total" data-display-savings>$0</div>
                    <p class="atera-compact-calculator__summary-subtext"><?php esc_html_e( 'annually — estimated based on Atera’s Pro Plan', 'atera' ); ?></p>
                    <a href="#start-trial" class="atera-compact-calculator__summary-cta"><?php esc_html_e( 'Start free trial', 'atera' ); ?></a>
                    <div class="atera-compact-calculator__summary-breakdown">
                        <div class="atera-compact-calculator__summary-breakdown-header"><?php esc_html_e( 'Average annual cost', 'atera' ); ?></div>
                        <div class="atera-compact-calculator__summary-breakdown-row">
                            <span><?php esc_html_e( 'Atera', 'atera' ); ?></span>
                            <span data-display-atera-cost>$0</span>
                        </div>
                        <div class="atera-compact-calculator__summary-breakdown-row">
                            <span><?php esc_html_e( 'Current provider', 'atera' ); ?></span>
                            <span data-display-current-cost>$0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p class="atera-compact-calculator__note"><?php esc_html_e( 'Prices are shown in US Dollars', 'atera' ); ?></p>
    </div>
    <?php

    return ob_get_clean();
}

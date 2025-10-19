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
    $default_title  = __( 'Calculate how much you save with Atera', 'atera' );
    $title_attribute = isset( $attributes['title'] ) ? $attributes['title'] : '';
    $title          = '' !== trim( wp_strip_all_tags( (string) $title_attribute ) ) ? $title_attribute : $default_title;
    $summary_kicker = isset( $attributes['summaryKicker'] ) && '' !== trim( $attributes['summaryKicker'] )
        ? $attributes['summaryKicker']
        : __( 'You save', 'atera' );
    $summary_cta = isset( $attributes['summaryCta'] ) && '' !== trim( $attributes['summaryCta'] )
        ? $attributes['summaryCta']
        : __( 'Start free trial', 'atera' );
    $summary_subtext = isset( $attributes['summarySubtext'] ) && '' !== trim( $attributes['summarySubtext'] )
        ? $attributes['summarySubtext']
        : __( 'annually — estimated based on Atera’s Pro Plan', 'atera' );
    $summary_breakdown_header = isset( $attributes['summaryBreakdownHeader'] ) && '' !== trim( $attributes['summaryBreakdownHeader'] )
        ? $attributes['summaryBreakdownHeader']
        : __( 'Average annual cost', 'atera' );
    $label_atera = isset( $attributes['labelAtera'] ) && '' !== trim( $attributes['labelAtera'] )
        ? $attributes['labelAtera']
        : __( 'Atera', 'atera' );
    $label_current = isset( $attributes['labelCurrentProvider'] ) && '' !== trim( $attributes['labelCurrentProvider'] )
        ? $attributes['labelCurrentProvider']
        : __( 'Current provider', 'atera' );
    $note_text = isset( $attributes['noteText'] ) && '' !== trim( $attributes['noteText'] )
        ? $attributes['noteText']
        : __( 'Prices are shown in US Dollars', 'atera' );

    $currency_prefix = apply_filters(
        'atera_compact_calculator_currency_prefix',
        atera_compact_calculator_default_prefix(),
        $attributes
    );
    $config_endpoint = esc_url( rest_url( 'atera/v1/calculator-config' ) );

    ob_start();
    ?>
    <div class="atera-compact-calculator" data-config-endpoint="<?php echo $config_endpoint; ?>" data-currency-prefix="<?php echo esc_attr( $currency_prefix ); ?>">
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
                    <a href="#start-trial" class="atera-compact-calculator__summary-cta"><?php echo esc_html( $summary_cta ); ?></a>
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
    <?php

    return ob_get_clean();
}

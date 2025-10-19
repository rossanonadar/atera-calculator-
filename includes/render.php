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
    $default_title   = __( 'Calculate how much you save with Atera', 'atera' );
    $title_attribute = isset( $attributes['title'] ) ? $attributes['title'] : '';
    $title           = '' !== trim( wp_strip_all_tags( (string) $title_attribute ) ) ? $title_attribute : $default_title;
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

    return atera_compact_calculator_render_template(
        'calculator.php',
        array(
            'config_endpoint'          => $config_endpoint,
            'currency_prefix'          => $currency_prefix,
            'title'                    => $title,
            'summary_kicker'           => $summary_kicker,
            'summary_cta'              => $summary_cta,
            'summary_subtext'          => $summary_subtext,
            'summary_breakdown_header' => $summary_breakdown_header,
            'label_atera'              => $label_atera,
            'label_current'            => $label_current,
            'note_text'                => $note_text,
        )
    );
}

function atera_compact_calculator_render_template( $template, array $context = array() ) {
    $template_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/templates/' . ltrim( $template, '/' );

    if ( ! file_exists( $template_path ) ) {
        return '';
    }

    ob_start();
    extract( $context, EXTR_SKIP );
    include $template_path;

    return ob_get_clean();
}

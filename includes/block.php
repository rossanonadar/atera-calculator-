<?php
/**
 * Block registration for the Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function atera_compact_calculator_register_block() {
    $asset_url = plugins_url( 'assets/', ATERA_CALC_PLUGIN_FILE );

    wp_register_script(
        'atera-compact-calculator-utils',
        $asset_url . 'js/utils.js',
        array(),
        atera_compact_calculator_asset_version( 'assets/js/utils.js' ),
        true
    );

    wp_register_script(
        'atera-compact-calculator-block',
        $asset_url . 'js/block.js',
        array( 'atera-compact-calculator-utils', 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-components', 'wp-block-editor', 'wp-api-fetch' ),
        atera_compact_calculator_asset_version( 'assets/js/block.js' ),
        true
    );

    wp_register_script(
        'atera-compact-calculator-frontend',
        $asset_url . 'js/frontend.js',
        array( 'atera-compact-calculator-utils', 'wp-i18n' ),
        atera_compact_calculator_asset_version( 'assets/js/frontend.js' ),
        true
    );

    wp_register_style(
        'atera-compact-calculator-style',
        $asset_url . 'css/style.css',
        array(),
        atera_compact_calculator_asset_version( 'assets/css/style.css' )
    );

    wp_register_style(
        'atera-compact-calculator-editor-style',
        $asset_url . 'css/editor.css',
        array( 'wp-edit-blocks' ),
        atera_compact_calculator_asset_version( 'assets/css/editor.css' )
    );

    register_block_type(
        'atera/compact-calculator',
        array(
            'editor_script'   => 'atera-compact-calculator-block',
            'script'          => 'atera-compact-calculator-frontend',
            'style'           => 'atera-compact-calculator-style',
            'editor_style'    => 'atera-compact-calculator-editor-style',
            'attributes'      => array(
                'title'                  => array(
                    'type'    => 'string',
                    'default' => __( 'Calculate how much you save with Atera', 'atera' ),
                ),
                'summaryKicker'          => array(
                    'type'    => 'string',
                    'default' => __( 'You save', 'atera' ),
                ),
                'summaryCta'             => array(
                    'type'    => 'string',
                    'default' => __( 'Start free trial', 'atera' ),
                ),
                'summaryCtaHref'         => array(
                    'type'    => 'string',
                    'default' => '',
                ),
                'summarySubtext'         => array(
                    'type'    => 'string',
                    'default' => __( 'annually — estimated based on Atera’s Pro Plan', 'atera' ),
                ),
                'summaryBreakdownHeader' => array(
                    'type'    => 'string',
                    'default' => __( 'Average annual cost', 'atera' ),
                ),
                'labelAtera'             => array(
                    'type'    => 'string',
                    'default' => __( 'Atera', 'atera' ),
                ),
                'labelCurrentProvider'   => array(
                    'type'    => 'string',
                    'default' => __( 'Current provider', 'atera' ),
                ),
                'noteText'               => array(
                    'type'    => 'string',
                    'default' => __( 'Prices are shown in US Dollars', 'atera' ),
                ),
            ),
            'render_callback' => 'atera_compact_calculator_render_block',
        )
    );
}
add_action( 'init', 'atera_compact_calculator_register_block' );
